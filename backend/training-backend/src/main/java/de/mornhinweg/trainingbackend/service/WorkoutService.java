package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.workout.CreateWorkoutRequest;
import de.mornhinweg.trainingbackend.dto.workout.UpdateWorkoutRequest;
import de.mornhinweg.trainingbackend.dto.workout.WorkoutResponse;
import de.mornhinweg.trainingbackend.model.TrainingSplit;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.model.Workout;
import de.mornhinweg.trainingbackend.repository.ExerciseRepository;
import de.mornhinweg.trainingbackend.repository.TrainingSplitRepository;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import de.mornhinweg.trainingbackend.repository.WorkoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutService {

  private final WorkoutRepository workoutRepository;
  private final TrainingSplitRepository trainingSplitRepository;
  private final UserRepository userRepository;
  private final ExerciseRepository exerciseRepository;

  public List<WorkoutResponse> getWorkoutsBySplit(Long splitId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new RuntimeException("Split not found"));
    return workoutRepository.findBySplitIdOrderByOrderIndexAsc(splitId)
        .stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional
  public WorkoutResponse createWorkout(Long splitId, CreateWorkoutRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);
    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new RuntimeException("Split not found"));
    int nextOrderIndex = split.getWorkouts().size();
    Workout workout = Workout.builder()
        .split(split)
        .name(request.getName())
        .orderIndex(nextOrderIndex)
        .build();
    return toResponse(workoutRepository.save(workout));
  }

  public WorkoutResponse getWorkout(Long workoutId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    Workout workout = workoutRepository.findById(workoutId)
        .orElseThrow(() -> new RuntimeException("Workout not found"));
    if (!workout.getSplit().getUser().getId().equals(user.getId())) {
      throw new RuntimeException("Unauthorized");
    }
    return toResponse(workout);
  }

  @Transactional
  public WorkoutResponse updateWorkout(Long workoutId, UpdateWorkoutRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);
    Workout workout = workoutRepository.findById(workoutId)
        .orElseThrow(() -> new RuntimeException("Workout not found"));
    if (!workout.getSplit().getUser().getId().equals(user.getId())) {
      throw new RuntimeException("Unauthorized");
    }
    workout.setName(request.getName());
    return toResponse(workoutRepository.save(workout));
  }

  @Transactional
  public void deleteWorkout(Long workoutId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    Workout workout = workoutRepository.findById(workoutId)
        .orElseThrow(() -> new RuntimeException("Workout not found"));
    if (!workout.getSplit().getUser().getId().equals(user.getId())) {
      throw new RuntimeException("Unauthorized");
    }
    workoutRepository.delete(workout);
  }

  private User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
  }

  private WorkoutResponse toResponse(Workout workout) {
    return WorkoutResponse.builder()
        .id(workout.getId())
        .splitId(workout.getSplit().getId())
        .name(workout.getName())
        // Temporary exercises exist only for one-off training logs and should not count towards
        // the workout template's exercise count.
        .exerciseCount((int) exerciseRepository.countByWorkoutIdAndTemporaryFalse(workout.getId()))
        .orderIndex(workout.getOrderIndex())
        .createdAt(workout.getCreatedAt())
        .updatedAt(workout.getUpdatedAt())
        .build();
  }
}
