package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.training.*;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.exception.UnauthorizedException;
import de.mornhinweg.trainingbackend.model.*;
import de.mornhinweg.trainingbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingLogService {

  private final TrainingLogRepository trainingLogRepository;
  private final ExerciseLogRepository exerciseLogRepository;
  private final WorkoutRepository workoutRepository;
  private final ExerciseRepository exerciseRepository;
  private final UserRepository userRepository;

  @Transactional
  public TrainingLogResponse startTraining(StartTrainingRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);

    // Fetch the specific workout day the user wants to train
    Workout workout = workoutRepository.findById(request.getWorkoutId())
        .orElseThrow(() -> new ResourceNotFoundException("Workout not found"));

    // Verify the workout belongs to this user
    if (!workout.getSplit().getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException("Access denied");
    }

    TrainingSplit split = workout.getSplit();

    TrainingLog trainingLog = TrainingLog.builder()
        .user(user)
        .split(split)
        .workout(workout)  // Added workout reference
        .startedAt(LocalDateTime.now())
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
          .weightUsed(exercise.getLastUsedWeight())
          .completed(false)
          .build();
      exerciseLogRepository.save(exerciseLog);
    }

    trainingLog = trainingLogRepository.findById(trainingLog.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));

    return toResponse(trainingLog);
  }

  @Transactional
  public ExerciseLogResponse updateExerciseLog(Long exerciseLogId, UpdateExerciseLogRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);

    ExerciseLog exerciseLog = exerciseLogRepository.findById(exerciseLogId)
        .orElseThrow(() -> new ResourceNotFoundException("Exercise log not found"));

    if (!exerciseLog.getTrainingLog().getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException("Access denied");
    }

    if (request.getSetsCompleted() != null) exerciseLog.setSetsCompleted(request.getSetsCompleted());
    if (request.getRepsCompleted() != null) exerciseLog.setRepsCompleted(request.getRepsCompleted());
    if (request.getWeightUsed() != null) exerciseLog.setWeightUsed(request.getWeightUsed());
    if (request.getCompleted() != null) exerciseLog.setCompleted(request.getCompleted());
    if (request.getNotes() != null) exerciseLog.setNotes(request.getNotes());

    exerciseLog = exerciseLogRepository.save(exerciseLog);
    return toExerciseLogResponse(exerciseLog);
  }

  @Transactional
  public ExerciseLogResponse addExerciseLog(Long trainingLogId, AddExerciseLogRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);

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

    Exercise exercise = Exercise.builder()
        .workout(workout)
        .name(request.getName())
        .sets(request.getSets())
        .reps(request.getReps())
        .plannedWeight(request.getPlannedWeight())
        .orderIndex(nextOrderIndex)
        .temporary(temporary)
        .build();
    exercise = exerciseRepository.save(exercise);

    ExerciseLog exerciseLog = ExerciseLog.builder()
        .trainingLog(trainingLog)
        .exercise(exercise)
        .setsCompleted(0)
        .repsCompleted(0)
        .weightUsed(exercise.getLastUsedWeight())
        .completed(false)
        .build();
    exerciseLog = exerciseLogRepository.save(exerciseLog);

    return toExerciseLogResponse(exerciseLog);
  }

  @Transactional
  public TrainingLogResponse completeTraining(Long trainingLogId, CompleteTrainingRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);

    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));

    trainingLog.setCompletedAt(LocalDateTime.now());
    trainingLog.setDurationSeconds(
        (int) Duration.between(trainingLog.getStartedAt(), trainingLog.getCompletedAt()).getSeconds()
    );

    if (request.getNotes() != null) {
      trainingLog.setNotes(request.getNotes());
    }

    trainingLog = trainingLogRepository.save(trainingLog);

    for (ExerciseLog exerciseLog : trainingLog.getExerciseLogs()) {
      if (exerciseLog.getCompleted() && exerciseLog.getWeightUsed() != null) {
        Exercise exercise = exerciseLog.getExercise();
        exercise.setLastUsedWeight(exerciseLog.getWeightUsed());
        exercise.setLastTrainedAt(LocalDateTime.now());
        exerciseRepository.save(exercise);
      }
    }

    return toResponse(trainingLog);
  }

  public List<TrainingLogResponse> getAllTrainings(Authentication authentication) {
    User user = getCurrentUser(authentication);
    return trainingLogRepository.findByUserIdOrderByStartedAtDesc(user.getId())
        .stream().map(this::toResponse).collect(Collectors.toList());
  }

  public List<TrainingLogResponse> getActiveTrainings(Authentication authentication) {
    User user = getCurrentUser(authentication);
    return trainingLogRepository.findByUserIdAndCompletedAtIsNullOrderByStartedAtDesc(user.getId())
        .stream().map(this::toResponse).collect(Collectors.toList());
  }

  public TrainingLogResponse getTraining(Long trainingLogId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));
    return toResponse(trainingLog);
  }

  private User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }

  @Transactional
  public void deleteTraining(Long trainingLogId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Training log not found"));
    trainingLogRepository.delete(trainingLog);
  }

  private TrainingLogResponse toResponse(TrainingLog trainingLog) {
    return TrainingLogResponse.builder()
        .id(trainingLog.getId())
        .splitId(trainingLog.getSplit().getId())
        .splitName(trainingLog.getSplit().getName())
        .workoutId(trainingLog.getWorkout().getId())  // Added workout ID
        .workoutName(trainingLog.getWorkout().getName())  // Added workout name
        .startedAt(trainingLog.getStartedAt())
        .completedAt(trainingLog.getCompletedAt())
        .durationSeconds(trainingLog.getDurationSeconds())
        .notes(trainingLog.getNotes())
        .exercises(trainingLog.getExerciseLogs().stream()
            .map(this::toExerciseLogResponse)
            .collect(Collectors.toList()))
        .isCompleted(trainingLog.isCompleted())
        .build();
  }

  private ExerciseLogResponse toExerciseLogResponse(ExerciseLog exerciseLog) {
    Exercise exercise = exerciseLog.getExercise();
    return ExerciseLogResponse.builder()
        .id(exerciseLog.getId())
        .exerciseId(exercise.getId())
        .exerciseName(exercise.getName())
        .workoutId(exercise.getWorkout().getId())
        .workoutName(exercise.getWorkout().getName())
        .plannedSets(exercise.getSets())
        .plannedReps(exercise.getReps())
        .plannedWeight(exercise.getPlannedWeight())
        .setsCompleted(exerciseLog.getSetsCompleted())
        .repsCompleted(exerciseLog.getRepsCompleted())
        .weightUsed(exerciseLog.getWeightUsed())
        .completed(exerciseLog.getCompleted())
        .notes(exerciseLog.getNotes())
        .build();
  }
}
