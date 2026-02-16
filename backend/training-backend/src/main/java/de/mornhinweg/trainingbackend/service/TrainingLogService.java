package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.training.*;
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
  private final TrainingSplitRepository trainingSplitRepository;
  private final WorkoutRepository workoutRepository;
  private final UserRepository userRepository;

  @Transactional
  public TrainingLogResponse startTraining(StartTrainingRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(request.getSplitId(), user.getId())
        .orElseThrow(() -> new RuntimeException("Split not found"));

    TrainingLog trainingLog = TrainingLog.builder()
        .user(user)
        .split(split)
        .startedAt(LocalDateTime.now())
        .build();

    trainingLog = trainingLogRepository.save(trainingLog);

    List<Workout> workouts = workoutRepository.findBySplitIdOrderByOrderIndexAsc(split.getId());

    for (Workout workout : workouts) {
      ExerciseLog exerciseLog = ExerciseLog.builder()
          .trainingLog(trainingLog)
          .workout(workout)
          .setsCompleted(0)
          .repsCompleted(0)
          .weightUsed(workout.getLastUsedWeight())
          .completed(false)
          .build();

      exerciseLogRepository.save(exerciseLog);
    }

    trainingLog = trainingLogRepository.findById(trainingLog.getId())
        .orElseThrow(() -> new RuntimeException("Training log not found"));

    return toResponse(trainingLog);
  }

  @Transactional
  public ExerciseLogResponse updateExercise(Long exerciseLogId, UpdateExerciseRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);

    ExerciseLog exerciseLog = exerciseLogRepository.findById(exerciseLogId)
        .orElseThrow(() -> new RuntimeException("Exercise log not found"));

    if (!exerciseLog.getTrainingLog().getUser().getId().equals(user.getId())) {
      throw new RuntimeException("Unauthorized");
    }

    if (request.getSetsCompleted() != null) {
      exerciseLog.setSetsCompleted(request.getSetsCompleted());
    }
    if (request.getRepsCompleted() != null) {
      exerciseLog.setRepsCompleted(request.getRepsCompleted());
    }
    if (request.getWeightUsed() != null) {
      exerciseLog.setWeightUsed(request.getWeightUsed());
    }
    if (request.getCompleted() != null) {
      exerciseLog.setCompleted(request.getCompleted());
    }
    if (request.getNotes() != null) {
      exerciseLog.setNotes(request.getNotes());
    }

    exerciseLog = exerciseLogRepository.save(exerciseLog);
    return toExerciseLogResponse(exerciseLog);
  }

  @Transactional
  public TrainingLogResponse completeTraining(Long trainingLogId, CompleteTrainingRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);

    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new RuntimeException("Training log not found"));

    trainingLog.setCompletedAt(LocalDateTime.now());

    Duration duration = Duration.between(trainingLog.getStartedAt(), trainingLog.getCompletedAt());
    trainingLog.setDurationSeconds((int) duration.getSeconds());

    if (request.getNotes() != null) {
      trainingLog.setNotes(request.getNotes());
    }

    trainingLog = trainingLogRepository.save(trainingLog);

    for (ExerciseLog exerciseLog : trainingLog.getExerciseLogs()) {
      if (exerciseLog.getCompleted() && exerciseLog.getWeightUsed() != null) {
        Workout workout = exerciseLog.getWorkout();
        workout.setLastUsedWeight(exerciseLog.getWeightUsed());
        workout.setLastTrainedAt(LocalDateTime.now());
        workoutRepository.save(workout);
      }
    }

    return toResponse(trainingLog);
  }

  public List<TrainingLogResponse> getAllTrainings(Authentication authentication) {
    User user = getCurrentUser(authentication);
    return trainingLogRepository.findByUserIdOrderByStartedAtDesc(user.getId())
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  public List<TrainingLogResponse> getActiveTrainings(Authentication authentication) {
    User user = getCurrentUser(authentication);
    return trainingLogRepository.findByUserIdAndCompletedAtIsNullOrderByStartedAtDesc(user.getId())
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  public TrainingLogResponse getTraining(Long trainingLogId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    TrainingLog trainingLog = trainingLogRepository.findByIdAndUserId(trainingLogId, user.getId())
        .orElseThrow(() -> new RuntimeException("Training log not found"));
    return toResponse(trainingLog);
  }

  private User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
  }

  private TrainingLogResponse toResponse(TrainingLog trainingLog) {
    return TrainingLogResponse.builder()
        .id(trainingLog.getId())
        .splitId(trainingLog.getSplit().getId())
        .splitName(trainingLog.getSplit().getName())
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
    Workout workout = exerciseLog.getWorkout();
    return ExerciseLogResponse.builder()
        .id(exerciseLog.getId())
        .workoutId(workout.getId())
        .workoutName(workout.getName())
        .plannedSets(workout.getSets())
        .plannedReps(workout.getReps())
        .plannedWeight(workout.getPlannedWeight())
        .setsCompleted(exerciseLog.getSetsCompleted())
        .repsCompleted(exerciseLog.getRepsCompleted())
        .weightUsed(exerciseLog.getWeightUsed())
        .completed(exerciseLog.getCompleted())
        .notes(exerciseLog.getNotes())
        .build();
  }
}