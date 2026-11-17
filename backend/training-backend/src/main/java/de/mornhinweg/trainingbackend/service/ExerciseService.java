package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.exercise.*;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.exception.UnauthorizedException;
import de.mornhinweg.trainingbackend.model.Exercise;
import de.mornhinweg.trainingbackend.model.LibraryExercise;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.model.Workout;
import de.mornhinweg.trainingbackend.repository.ExerciseRepository;
import de.mornhinweg.trainingbackend.repository.WorkoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseService {

  private final ExerciseRepository exerciseRepository;
  private final CurrentUserService currentUser;
  private final WorkoutRepository workoutRepository;
  private final LibraryExerciseService libraryExerciseService;

  public List<ExerciseResponse> getExercisesByWorkout(Long workoutId, Authentication authentication) {
    User user = currentUser.get(authentication);
    Workout workout = getOwnedWorkout(workoutId, user);
    // Temporary exercises are created for one-off logging during a training session and should not
    // show up on the workout template.
    return planOf(workout.getId()).stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional
  public ExerciseResponse createExercise(Long workoutId, CreateExerciseRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);
    Workout workout = getOwnedWorkout(workoutId, user);
    int nextOrderIndex = exerciseRepository
        .findByWorkoutIdAndTemporaryFalseOrderByOrderIndexAsc(workout.getId())
        .size();
    LibraryExercise libraryExercise = libraryExerciseService.resolve(user, request.getLibraryExerciseId(), request.getName());
    libraryExerciseService.applyDetails(libraryExercise,
        request.getDescription(), request.getVideoUrl(), request.getVideoId(), request.getRepUnit());
    libraryExerciseService.applyEquipment(libraryExercise, request.getEquipment());
    libraryExerciseService.applyMuscles(libraryExercise, request.getMuscles());
    libraryExerciseService.applyCatalogExercise(libraryExercise, request.getCatalogExerciseId());
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
    User user = currentUser.get(authentication);
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
    exercise = exerciseRepository.save(exercise);
    if (request.getOrderIndex() != null) normalizeSupersets(exercise.getWorkout().getId());
    return toResponse(exercise);
  }

  @Transactional
  public void reorderExercises(Long workoutId, ReorderExercisesRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);
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
    normalizeSupersets(workoutId);
  }

  @Transactional
  public void deleteExercise(Long exerciseId, Authentication authentication) {
    User user = currentUser.get(authentication);
    Exercise exercise = getOwnedExercise(exerciseId, user);
    Long workoutId = exercise.getWorkout().getId();
    exerciseRepository.delete(exercise);
    exerciseRepository.flush();
    normalizeSupersets(workoutId);
  }

  /**
   * Supersets the exercise with the one after it in the workout: the next one joins the
   * exercise's group, or both start one, and a group the next one was already in merges into it.
   * Returns the workout's exercises, as the groups may have been renumbered.
   */
  @Transactional
  public List<ExerciseResponse> supersetWithNext(Long workoutId, Long exerciseId, Authentication authentication) {
    User user = currentUser.get(authentication);
    Exercise exercise = getOwnedExercise(exerciseId, user);
    requireInWorkout(exercise, workoutId);
    if (exercise.getTemporary()) {
      throw new BadRequestException("Exercises added during a session can't be in a superset");
    }
    List<Exercise> plan = planOf(workoutId);
    int index = indexOf(plan, exercise);
    if (index == plan.size() - 1) {
      throw new BadRequestException("The last exercise has no next one to superset with");
    }
    Exercise next = plan.get(index + 1);
    Integer merged = next.getSupersetGroup();
    Integer group = exercise.getSupersetGroup() != null ? exercise.getSupersetGroup()
        : merged != null ? merged
        : plan.stream().map(Exercise::getSupersetGroup).filter(g -> g != null).max(Integer::compare).orElse(0) + 1;
    exercise.setSupersetGroup(group);
    for (Exercise e : plan) {
      if (e == next || (merged != null && merged.equals(e.getSupersetGroup()))) e.setSupersetGroup(group);
    }
    return normalizeSupersets(workoutId).stream().map(this::toResponse).collect(Collectors.toList());
  }

  /**
   * Takes the exercise out of its superset. The members before and after it become separate
   * groups (or none, when only one is left on a side). Returns the workout's exercises.
   */
  @Transactional
  public List<ExerciseResponse> removeFromSuperset(Long workoutId, Long exerciseId, Authentication authentication) {
    User user = currentUser.get(authentication);
    Exercise exercise = getOwnedExercise(exerciseId, user);
    requireInWorkout(exercise, workoutId);
    exercise.setSupersetGroup(null);
    return normalizeSupersets(workoutId).stream().map(this::toResponse).collect(Collectors.toList());
  }

  // The order exercises are listed and grouped in; the id breaks ties of older data
  private static final Comparator<Exercise> PLAN_ORDER = Comparator
      .comparing(Exercise::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder()))
      .thenComparing(Exercise::getId);

  /** The workout's plan (its exercises without the session-only ones), in order. */
  private List<Exercise> planOf(Long workoutId) {
    return exerciseRepository.findByWorkoutIdAndTemporaryFalseOrderByOrderIndexAsc(workoutId)
        .stream().sorted(PLAN_ORDER).toList();
  }

  /**
   * Keeps the workout's supersets valid after its exercises were regrouped, reordered or
   * deleted: a group is one run of adjacent exercises (a group split apart becomes one group per
   * run), a run of a single exercise is no group, and groups are numbered 1, 2, ... in order. The
   * order is compacted to 0, 1, ... so that adjacency is never down to a tie. Returns the plan.
   */
  private List<Exercise> normalizeSupersets(Long workoutId) {
    List<Exercise> plan = planOf(workoutId);
    int nextGroup = 1;
    int start = 0;
    while (start < plan.size()) {
      Integer group = plan.get(start).getSupersetGroup();
      int end = start + 1;
      while (group != null && end < plan.size() && group.equals(plan.get(end).getSupersetGroup())) end++;
      Integer assigned = group != null && end - start > 1 ? nextGroup++ : null;
      for (int i = start; i < end; i++) {
        plan.get(i).setSupersetGroup(assigned);
        plan.get(i).setOrderIndex(i);
      }
      start = end;
    }
    exerciseRepository.saveAll(plan);
    return plan;
  }

  private static int indexOf(List<Exercise> plan, Exercise exercise) {
    for (int i = 0; i < plan.size(); i++) {
      if (plan.get(i).getId().equals(exercise.getId())) return i;
    }
    throw new ResourceNotFoundException("Exercise not found");
  }

  // The exercise must be in the workout of the path, so a request can't regroup another workout
  private static void requireInWorkout(Exercise exercise, Long workoutId) {
    if (!exercise.getWorkout().getId().equals(workoutId)) {
      throw new ResourceNotFoundException("Exercise not found");
    }
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

  public ExerciseProgressResponse getProgress(Long exerciseId, Authentication authentication) {
    User user = currentUser.get(authentication);
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
        .supersetGroup(exercise.getSupersetGroup())
        .build();
  }
}
