package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.exercise.*;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.exception.UnauthorizedException;
import de.mornhinweg.trainingbackend.model.Exercise;
import de.mornhinweg.trainingbackend.model.LibraryExercise;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.model.Workout;
import de.mornhinweg.trainingbackend.repository.ExerciseRepository;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import de.mornhinweg.trainingbackend.repository.WorkoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseService {

  private final ExerciseRepository exerciseRepository;
  private final WorkoutRepository workoutRepository;
  private final UserRepository userRepository;
  private final LibraryExerciseService libraryExerciseService;

  public List<ExerciseResponse> getExercisesByWorkout(Long workoutId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    Workout workout = getOwnedWorkout(workoutId, user);
    // Temporary exercises are created for one-off logging during a training session and should not
    // show up on the workout template.
    return exerciseRepository.findByWorkoutIdAndTemporaryFalseOrderByOrderIndexAsc(workout.getId())
        .stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional
  public ExerciseResponse createExercise(Long workoutId, CreateExerciseRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);
    Workout workout = getOwnedWorkout(workoutId, user);
    int nextOrderIndex = exerciseRepository
        .findByWorkoutIdAndTemporaryFalseOrderByOrderIndexAsc(workout.getId())
        .size();
    LibraryExercise libraryExercise = libraryExerciseService.resolve(user, request.getLibraryExerciseId(), request.getName());
    libraryExerciseService.applyDetails(libraryExercise,
        request.getDescription(), request.getVideoUrl(), request.getVideoId(), request.getRepUnit());
    Exercise exercise = Exercise.builder()
        .workout(workout)
        .libraryExercise(libraryExercise)
        .sets(request.getSets())
        .reps(request.getReps())
        .plannedWeight(request.getPlannedWeight())
        .orderIndex(nextOrderIndex)
        .temporary(false)
        .build();
    return toResponse(exerciseRepository.save(exercise));
  }

  @Transactional
  public ExerciseResponse updateExercise(Long exerciseId, UpdateExerciseRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);
    Exercise exercise = getOwnedExercise(exerciseId, user);
    if (request.getLibraryExerciseId() != null) {
      exercise.setLibraryExercise(libraryExerciseService.resolve(user, request.getLibraryExerciseId(), null));
    } else if (request.getName() != null) {
      LibraryExercise current = exercise.getLibraryExercise();
      if (current.getName().equalsIgnoreCase(request.getName().trim())) {
        // Only the capitalization changed, so fix it on the entry itself
        libraryExerciseService.rename(current, request.getName());
      } else {
        exercise.setLibraryExercise(libraryExerciseService.renameFor(user, current, request.getName()));
      }
    }
    libraryExerciseService.applyDetails(exercise.getLibraryExercise(),
        request.getDescription(), request.getVideoUrl(), request.getVideoId(), request.getRepUnit());
    if (request.getSets() != null) exercise.setSets(request.getSets());
    if (request.getReps() != null) exercise.setReps(request.getReps());
    if (request.getPlannedWeight() != null) exercise.setPlannedWeight(request.getPlannedWeight());
    if (request.getOrderIndex() != null) exercise.setOrderIndex(request.getOrderIndex());
    return toResponse(exerciseRepository.save(exercise));
  }

  @Transactional
  public void reorderExercises(Long workoutId, ReorderExercisesRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);
    getOwnedWorkout(workoutId, user);

    Map<Long, Integer> orderMap = request.getExercises().stream()
        .collect(Collectors.toMap(
            ReorderExercisesRequest.ExerciseOrderItem::getId,
            ReorderExercisesRequest.ExerciseOrderItem::getOrderIndex
        ));

    // Reordering only applies to workout-template exercises.
    List<Exercise> exercises = exerciseRepository.findByWorkoutIdAndTemporaryFalseOrderByOrderIndexAsc(workoutId);
    for (Exercise exercise : exercises) {
      Integer newIndex = orderMap.get(exercise.getId());
      if (newIndex != null) {
        exercise.setOrderIndex(newIndex);
      }
    }
    exerciseRepository.saveAll(exercises);
  }

  @Transactional
  public void deleteExercise(Long exerciseId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    Exercise exercise = getOwnedExercise(exerciseId, user);
    exerciseRepository.delete(exercise);
  }

  private Workout getOwnedWorkout(Long workoutId, User user) {
    Workout workout = workoutRepository.findById(workoutId)
        .orElseThrow(() -> new ResourceNotFoundException("Workout not found"));
    if (!workout.getSplit().getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException("Access denied");
    }
    return workout;
  }

  private Exercise getOwnedExercise(Long exerciseId, User user) {
    Exercise exercise = exerciseRepository.findById(exerciseId)
        .orElseThrow(() -> new ResourceNotFoundException("Exercise not found"));
    if (!exercise.getWorkout().getSplit().getUser().getId().equals(user.getId())) {
      throw new UnauthorizedException("Access denied");
    }
    return exercise;
  }

  private User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }

  public ExerciseProgressResponse getProgress(Long exerciseId, Authentication authentication) {
    User user = getCurrentUser(authentication);
    Exercise exercise = getOwnedExercise(exerciseId, user);
    return libraryExerciseService.buildProgress(exercise.getLibraryExercise(), exercise.getId());
  }

  private ExerciseResponse toResponse(Exercise exercise) {
    return ExerciseResponse.builder()
        .id(exercise.getId())
        .workoutId(exercise.getWorkout().getId())
        .libraryExerciseId(exercise.getLibraryExercise().getId())
        .name(exercise.getLibraryExercise().getName())
        .description(exercise.getLibraryExercise().getDescription())
        .videoUrl(exercise.getLibraryExercise().getVideoUrl())
        .videoId(exercise.getLibraryExercise().getVideoId())
        .sets(exercise.getSets())
        .reps(exercise.getReps())
        .repUnit(exercise.getLibraryExercise().getRepUnit())
        .plannedWeight(exercise.getPlannedWeight())
        .lastUsedWeight(exercise.getLastUsedWeight())
        .lastTrainedAt(exercise.getLastTrainedAt())
        .orderIndex(exercise.getOrderIndex())
        .createdAt(exercise.getCreatedAt())
        .updatedAt(exercise.getUpdatedAt())
        .build();
  }
}
