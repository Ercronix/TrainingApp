package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.training.*;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.exception.UnauthorizedException;
import de.mornhinweg.trainingbackend.model.*;
import de.mornhinweg.trainingbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Limit;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingLogService {

  // The latest completed session of an exercise and the one before it
  private static final Limit RECENT_SESSIONS = Limit.of(2);

  private final TrainingLogRepository trainingLogRepository;
  private final CurrentUserService currentUser;
  private final ExerciseLogRepository exerciseLogRepository;
  private final WorkoutRepository workoutRepository;
  private final ExerciseRepository exerciseRepository;
  private final LibraryExerciseService libraryExerciseService;

  @Transactional
  public TrainingLogResponse startTraining(StartTrainingRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);

    // Fetch the specific workout day the user wants to train
    Workout workout = workoutRepository.findById(request.getWorkoutId())
        .orElseThrow(() -> new ResourceNotFoundException("Workout not found"));

    // Verify the workout belongs to this user
    if (!workout.getSplit().getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException("Access denied");
    }

    TrainingSplit split = workout.getSplit();
    LocalDate today = request.getLocalDate() != null ? request.getLocalDate() : LocalDate.now();
    boolean deload = Mesocycle.isDeload(split.getMesocycleWeeks(), split.getMesocycleStartDate(), today);

    TrainingLog trainingLog = TrainingLog.builder()
        .user(user)
        .split(split)
        .workout(workout)  // Added workout reference
        .startedAt(LocalDateTime.now())
        .deload(deload)
        .build();

    trainingLog = trainingLogRepository.save(trainingLog);

    // Create an exercise log only for exercises in this specific workout day
    // Only include workout-template exercises. Temporary exercises are for ad-hoc logging.
    List<Exercise> exercises = exerciseRepository.findByWorkoutIdAndTemporaryFalseOrderByOrderIndexAsc(workout.getId());

    for (Exercise exercise : exercises) {
      ExerciseLog exerciseLog = ExerciseLog.builder()
          .trainingLog(trainingLog)
          .exercise(exercise)
          .setsCompleted(0)
          .repsCompleted(0)
          .weightUsed(startingWeight(exercise, trainingLog))
          .completed(false)
          .build();
      // Also into the session's list, so the response carries the exercises
      trainingLog.getExerciseLogs().add(exerciseLogRepository.save(exerciseLog));
    }

    return toResponse(trainingLog, true);
  }

  @Transactional
  public ExerciseLogResponse updateExerciseLog(Long exerciseLogId, UpdateExerciseLogRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);

    ExerciseLog exerciseLog = exerciseLogRepository.findById(exerciseLogId)
        .orElseThrow(() -> new ResourceNotFoundException("Exercise log not found"));

    if (!exerciseLog.getTrainingLog().getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException("Access denied");
    }

    if (request.getSets() != null) {
      exerciseLog.replaceSets(request.getSets().stream()
          .map(s -> SetLog.builder()
              .reps(s.getReps())
              .weight(s.getWeight())
              .rpe(s.getRpe())
              .warmup(Boolean.TRUE.equals(s.getWarmup()))
              .build())
          .toList());
    } else if (request.getSetsCompleted() != null || request.getRepsCompleted() != null || request.getWeightUsed() != null) {
      // A plain sets × reps @ weight becomes that many identical working sets
      int sets = request.getSetsCompleted() != null ? request.getSetsCompleted() : exerciseLog.getSetsCompleted();
      int reps = request.getRepsCompleted() != null ? request.getRepsCompleted() : exerciseLog.getRepsCompleted();
      BigDecimal weight = request.getWeightUsed() != null ? request.getWeightUsed() : exerciseLog.getWeightUsed();
      if (sets < 0 || sets > 50 || reps < 0) {
        throw new BadRequestException("Invalid sets or reps");
      }
      exerciseLog.replaceSets(Collections.nCopies(sets, SetLog.builder().reps(reps).weight(weight).build()));
    }
    if (request.getCompleted() != null) exerciseLog.setCompleted(request.getCompleted());
    if (request.getNotes() != null) exerciseLog.setNotes(request.getNotes());
    touch(exerciseLog.getTrainingLog());

    exerciseLog = exerciseLogRepository.save(exerciseLog);
    return toExerciseLogResponse(exerciseLog, true);
  }

  @Transactional
  public ExerciseLogResponse addExerciseLog(Long trainingLogId, AddExerciseLogRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);

    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));

    if (trainingLog.isCompleted()) {
      throw new BadRequestException("Training is already completed");
    }

    Workout workout = trainingLog.getWorkout();

    boolean addToWorkout = Boolean.TRUE.equals(request.getAddToWorkout());
    boolean temporary = !addToWorkout;

    int nextOrderIndex = addToWorkout
        ? exerciseRepository.findByWorkoutIdAndTemporaryFalseOrderByOrderIndexAsc(workout.getId()).size()
        : exerciseRepository.findByWorkoutIdOrderByOrderIndexAsc(workout.getId()).size();

    LibraryExercise libraryExercise = libraryExerciseService.resolve(user, request.getLibraryExerciseId(), request.getName());
    libraryExerciseService.applyEquipment(libraryExercise, request.getEquipment());
    libraryExerciseService.applyMuscles(libraryExercise, request.getMuscles());
    libraryExerciseService.applyCatalogExercise(libraryExercise, request.getCatalogExerciseId());

    Exercise exercise = Exercise.builder()
        .workout(workout)
        .libraryExercise(libraryExercise)
        .sets(request.getSets())
        .reps(request.getReps())
        .repsMax(RepRanges.topOf(request.getReps(), request.getRepsMax()))
        .plannedWeight(request.getPlannedWeight())
        .orderIndex(nextOrderIndex)
        .temporary(temporary)
        .build();
    exercise = exerciseRepository.save(exercise);
    touch(trainingLog);

    ExerciseLog exerciseLog = ExerciseLog.builder()
        .trainingLog(trainingLog)
        .exercise(exercise)
        .setsCompleted(0)
        .repsCompleted(0)
        .weightUsed(startingWeight(exercise, trainingLog))
        .completed(false)
        .build();
    exerciseLog = exerciseLogRepository.save(exerciseLog);

    return toExerciseLogResponse(exerciseLog, true);
  }

  // The weight a new exercise log starts from: the last one used, lowered in a deload
  private BigDecimal startingWeight(Exercise exercise, TrainingLog trainingLog) {
    BigDecimal last = exercise.getLastUsedWeight();
    return Boolean.TRUE.equals(trainingLog.getDeload()) ? Deload.weight(last) : last;
  }

  /**
   * Swaps the exercise of a running session for another one, for this session only: the log keeps
   * its id (and so its place) but starts over, and the workout's plan stays unchanged.
   */
  @Transactional
  public ExerciseLogResponse replaceExerciseLog(Long exerciseLogId, ReplaceExerciseLogRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);
    ExerciseLog exerciseLog = getRunningExerciseLog(exerciseLogId, user);
    Exercise replaced = exerciseLog.getExercise();
    Workout workout = exerciseLog.getTrainingLog().getWorkout();

    LibraryExercise libraryExercise = libraryExerciseService.resolve(user, request.getLibraryExerciseId(), request.getName());
    libraryExerciseService.applyEquipment(libraryExercise, request.getEquipment());
    libraryExerciseService.applyMuscles(libraryExercise, request.getMuscles());
    libraryExerciseService.applyCatalogExercise(libraryExercise, request.getCatalogExerciseId());

    Exercise exercise = Exercise.builder()
        .workout(workout)
        .libraryExercise(libraryExercise)
        .sets(request.getSets())
        .reps(request.getReps())
        .repsMax(RepRanges.topOf(request.getReps(), request.getRepsMax()))
        .plannedWeight(request.getPlannedWeight())
        .orderIndex(exerciseRepository.findByWorkoutIdOrderByOrderIndexAsc(workout.getId()).size())
        .temporary(true)
        .build();
    exercise = exerciseRepository.save(exercise);

    exerciseLog.setExercise(exercise);
    exerciseLog.replaceSets(List.of());
    exerciseLog.setCompleted(false);
    exerciseLog.setNotes(null);
    touch(exerciseLog.getTrainingLog());
    exerciseLog = exerciseLogRepository.save(exerciseLog);

    deleteIfUnusedTemporary(replaced);
    return toExerciseLogResponse(exerciseLog, true);
  }

  /** Removes an exercise from a running session. The workout's plan stays unchanged. */
  @Transactional
  public void deleteExerciseLog(Long exerciseLogId, Authentication authentication) {
    User user = currentUser.get(authentication);
    ExerciseLog exerciseLog = getRunningExerciseLog(exerciseLogId, user);
    Exercise exercise = exerciseLog.getExercise();
    touch(exerciseLog.getTrainingLog());
    exerciseLogRepository.delete(exerciseLog);
    deleteIfUnusedTemporary(exercise);
  }

  private ExerciseLog getRunningExerciseLog(Long exerciseLogId, User user) {
    ExerciseLog exerciseLog = exerciseLogRepository.findById(exerciseLogId)
        .orElseThrow(() -> new ResourceNotFoundException("Exercise log not found"));
    if (!exerciseLog.getTrainingLog().getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException("Access denied");
    }
    if (exerciseLog.getTrainingLog().isCompleted()) {
      throw new BadRequestException("Training is already completed");
    }
    return exerciseLog;
  }

  // Only for sessions in progress: a set corrected in a finished session isn't activity in it
  private void touch(TrainingLog trainingLog) {
    if (!trainingLog.isCompleted()) trainingLog.setLastActivityAt(LocalDateTime.now());
  }

  // A temporary exercise only exists for the session it was added to, so it goes with its log
  private void deleteIfUnusedTemporary(Exercise exercise) {
    exerciseLogRepository.flush();
    if (exercise.getTemporary() && !exerciseLogRepository.existsByExerciseId(exercise.getId())) {
      exerciseRepository.delete(exercise);
    }
  }

  @Transactional
  public TrainingLogResponse completeTraining(Long trainingLogId, CompleteTrainingRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);

    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));

    // A repeated call (double tap, retried request) returns the finished session unchanged
    if (trainingLog.isCompleted()) {
      return toResponse(trainingLog, true);
    }

    // Backdated for a session completed offline, but never before it started
    LocalDateTime completedAt = LocalDateTime.now();
    if (request.getCompletedSecondsAgo() != null) {
      completedAt = completedAt.minusSeconds(request.getCompletedSecondsAgo());
      if (completedAt.isBefore(trainingLog.getStartedAt())) completedAt = trainingLog.getStartedAt();
    }
    trainingLog.setCompletedAt(completedAt);
    trainingLog.setDurationSeconds(
        (int) Duration.between(trainingLog.getStartedAt(), trainingLog.getCompletedAt()).getSeconds()
    );

    if (request.getNotes() != null) {
      trainingLog.setNotes(request.getNotes());
    }

    trainingLog = trainingLogRepository.save(trainingLog);

    // A deload's lighter weights aren't where the next regular session starts from
    boolean deload = Boolean.TRUE.equals(trainingLog.getDeload());
    for (ExerciseLog exerciseLog : trainingLog.getExerciseLogs()) {
      if (exerciseLog.getCompleted() && exerciseLog.getWeightUsed() != null) {
        Exercise exercise = exerciseLog.getExercise();
        if (!deload) exercise.setLastUsedWeight(exerciseLog.getWeightUsed());
        exercise.setLastTrainedAt(trainingLog.getCompletedAt());
        exerciseRepository.save(exercise);
      }
    }

    return toResponse(trainingLog, true);
  }

  /**
   * Sets the session's ratings and note, finished or not. Replaces all of them, so a repeated call
   * (an offline change replayed after a lost response) changes nothing.
   */
  @Transactional
  public TrainingLogResponse updateReview(Long trainingLogId, UpdateTrainingReviewRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);
    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));

    trainingLog.setRating(request.getRating());
    trainingLog.setEnergy(request.getEnergy());
    trainingLog.setSleep(request.getSleep());
    String notes = request.getNotes() != null ? request.getNotes().strip() : "";
    trainingLog.setNotes(notes.isEmpty() ? null : notes);

    return toResponse(trainingLogRepository.save(trainingLog), true);
  }

  public List<TrainingLogResponse> getAllTrainings(Authentication authentication) {
    User user = currentUser.get(authentication);
    return trainingLogRepository.findByUserIdOrderByStartedAtDesc(user.getId())
        .stream().map(log -> toResponse(log, false)).collect(Collectors.toList());
  }

  public List<TrainingLogResponse> getActiveTrainings(Authentication authentication) {
    User user = currentUser.get(authentication);
    return trainingLogRepository.findByUserIdAndCompletedAtIsNullOrderByStartedAtDesc(user.getId())
        .stream().map(log -> toResponse(log, true)).collect(Collectors.toList());
  }

  public TrainingLogResponse getTraining(Long trainingLogId, Authentication authentication) {
    User user = currentUser.get(authentication);
    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));
    return toResponse(trainingLog, true);
  }

  @Transactional
  public void deleteTraining(Long trainingLogId, Authentication authentication) {
    User user = currentUser.get(authentication);
    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));
    trainingLogRepository.delete(trainingLog);
  }

  private TrainingLogResponse toResponse(TrainingLog trainingLog, boolean includePrevious) {
    return TrainingLogResponse.builder()
        .id(trainingLog.getId())
        .splitId(trainingLog.getSplit().getId())
        .splitName(trainingLog.getSplit().getName())
        .workoutId(trainingLog.getWorkout().getId())  // Added workout ID
        .workoutName(trainingLog.getWorkout().getName())  // Added workout name
        .startedAt(trainingLog.getStartedAt())
        .completedAt(trainingLog.getCompletedAt())
        .lastActivityAt(trainingLog.getLastActivityAt())
        .durationSeconds(trainingLog.getDurationSeconds())
        .notes(trainingLog.getNotes())
        .deload(Boolean.TRUE.equals(trainingLog.getDeload()))
        .rating(trainingLog.getRating())
        .energy(trainingLog.getEnergy())
        .sleep(trainingLog.getSleep())
        .exercises(trainingLog.getExerciseLogs().stream()
            .map(el -> toExerciseLogResponse(el, includePrevious))
            .collect(Collectors.toList()))
        .isCompleted(trainingLog.isCompleted())
        .build();
  }

  private ExerciseLogResponse toExerciseLogResponse(ExerciseLog exerciseLog, boolean includePrevious) {
    Exercise exercise = exerciseLog.getExercise();
    LibraryExercise libraryExercise = exercise.getLibraryExercise();
    boolean deload = Boolean.TRUE.equals(exerciseLog.getTrainingLog().getDeload());
    boolean planIncomplete = exercise.getSets() == null || exercise.getReps() == null || exercise.getPlannedWeight() == null;
    // Previous values come from any workout that uses the same library exercise (deloads excluded):
    // the latest completed session, and the one before it (for the client's suggested next target).
    // A deload also needs them to fill in what the plan leaves open.
    List<ExerciseLog> recent = includePrevious || (deload && planIncomplete)
        ? exerciseLogRepository.findRecentCompleted(libraryExercise.getId(), exerciseLog.getTrainingLog().getId(), RECENT_SESSIONS)
        : List.of();
    ExerciseLog previous = !recent.isEmpty() ? recent.get(0) : null;
    ExerciseLog earlier = recent.size() > 1 ? recent.get(1) : null;
    Integer plannedSets = exercise.getSets();
    Integer plannedReps = exercise.getReps();
    BigDecimal plannedWeight = exercise.getPlannedWeight();
    if (deload) {
      // Lowered from the plan, or from the last regular session where the plan has no value.
      // The previous sessions are then left out, so clients prefill the deload targets instead
      // (and suggest no progression).
      if (plannedSets == null && previous != null && previous.getSetsCompleted() > 0) plannedSets = previous.getSetsCompleted();
      if (plannedReps == null && previous != null && previous.getRepsCompleted() > 0) plannedReps = previous.getRepsCompleted();
      if (plannedWeight == null && previous != null) plannedWeight = previous.getWeightUsed();
      plannedSets = Deload.sets(plannedSets);
      plannedWeight = Deload.weight(plannedWeight);
      previous = null;
      earlier = null;
    }
    // Records to beat: from sessions completed before this one started
    ExerciseLogRepository.Bests bests = includePrevious
        ? exerciseLogRepository.findBestsCompletedBefore(libraryExercise.getId(), exerciseLog.getTrainingLog().getStartedAt())
        : null;
    return ExerciseLogResponse.builder()
        .id(exerciseLog.getId())
        .exerciseId(exercise.getId())
        .libraryExerciseId(libraryExercise.getId())
        .exerciseName(libraryExercise.getName())
        .workoutId(exercise.getWorkout().getId())
        .workoutName(exercise.getWorkout().getName())
        .plannedSets(plannedSets)
        .plannedReps(plannedReps)
        .plannedRepsMax(exercise.getRepsMax())
        .plannedWeight(plannedWeight)
        .setsCompleted(exerciseLog.getSetsCompleted())
        .repsCompleted(exerciseLog.getRepsCompleted())
        .weightUsed(exerciseLog.getWeightUsed())
        .sets(SetLogResponse.fromAll(exerciseLog.getSetLogs()))
        .completed(exerciseLog.getCompleted())
        .notes(exerciseLog.getNotes())
        .repUnit(libraryExercise.getRepUnit())
        .equipment(libraryExercise.getEquipment())
        .weightIncrement(libraryExercise.getWeightIncrement())
        .previousSets(previous != null ? previous.getSetsCompleted() : null)
        .previousReps(previous != null ? previous.getRepsCompleted() : null)
        .previousWeight(previous != null ? previous.getWeightUsed() : null)
        .previousSetLogs(previous != null ? SetLogResponse.fromAll(previous.getSetLogs()) : null)
        .earlierSetLogs(earlier != null ? SetLogResponse.fromAll(earlier.getSetLogs()) : null)
        .bestWeight(bests != null ? bests.getBestWeight() : null)
        .bestOneRepMax(bests != null ? bests.getBestOneRepMax() : null)
        .supersetGroup(exercise.getSupersetGroup())
        .build();
  }
}
