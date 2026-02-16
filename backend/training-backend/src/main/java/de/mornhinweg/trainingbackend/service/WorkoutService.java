package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.workout.CreateWorkoutRequest;
import de.mornhinweg.trainingbackend.dto.workout.WorkoutResponse;
import de.mornhinweg.trainingbackend.model.TrainingSplit;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.model.Workout;
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

  public List<WorkoutResponse> getWorkoutsBySplit(Long splitId, Authentication authentication) {
    User user = getCurrentUser(authentication);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new RuntimeException("Split not found"));

    return workoutRepository.findBySplitIdOrderByOrderIndexAsc(splitId)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
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
        .description(request.getDescription())
        .videoUrl(request.getVideoUrl())
        .videoId(request.getVideoId())
        .sets(request.getSets())
        .reps(request.getReps())
        .plannedWeight(request.getPlannedWeight())
        .orderIndex(nextOrderIndex)
        .build();

    Workout savedWorkout = workoutRepository.save(workout);
    return toResponse(savedWorkout);
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
        .description(workout.getDescription())
        .videoUrl(workout.getVideoUrl())
        .videoId(workout.getVideoId())
        .sets(workout.getSets())
        .reps(workout.getReps())
        .plannedWeight(workout.getPlannedWeight())
        .lastUsedWeight(workout.getLastUsedWeight())
        .lastTrainedAt(workout.getLastTrainedAt())
        .orderIndex(workout.getOrderIndex())
        .createdAt(workout.getCreatedAt())
        .updatedAt(workout.getUpdatedAt())
        .build();
  }
}