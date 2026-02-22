package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.exercise.*;
import de.mornhinweg.trainingbackend.service.ExerciseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts/{workoutId}/exercises")
@RequiredArgsConstructor
public class ExerciseController {

  private final ExerciseService exerciseService;

  @GetMapping
  public ResponseEntity<List<ExerciseResponse>> getExercises(
      @PathVariable Long workoutId,
      Authentication authentication) {
    return ResponseEntity.ok(exerciseService.getExercisesByWorkout(workoutId, authentication));
  }

  @PostMapping
  public ResponseEntity<ExerciseResponse> createExercise(
      @PathVariable Long workoutId,
      @Valid @RequestBody CreateExerciseRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(exerciseService.createExercise(workoutId, request, authentication));
  }

  @PutMapping("/{exerciseId}")
  public ResponseEntity<ExerciseResponse> updateExercise(
      @PathVariable Long workoutId,
      @PathVariable Long exerciseId,
      @Valid @RequestBody UpdateExerciseRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(exerciseService.updateExercise(exerciseId, request, authentication));
  }

  @PatchMapping("/reorder")
  public ResponseEntity<Void> reorderExercises(
      @PathVariable Long workoutId,
      @RequestBody ReorderExercisesRequest request,
      Authentication authentication) {
    exerciseService.reorderExercises(workoutId, request, authentication);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{exerciseId}")
  public ResponseEntity<Void> deleteExercise(
      @PathVariable Long workoutId,
      @PathVariable Long exerciseId,
      Authentication authentication) {
    exerciseService.deleteExercise(exerciseId, authentication);
    return ResponseEntity.noContent().build();
  }
}