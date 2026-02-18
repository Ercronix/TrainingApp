package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.exercise.CreateExerciseRequest;
import de.mornhinweg.trainingbackend.dto.exercise.ExerciseResponse;
import de.mornhinweg.trainingbackend.dto.exercise.UpdateExerciseRequest;
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
    ExerciseResponse exercise = exerciseService.createExercise(workoutId, request, authentication);
    return ResponseEntity.status(HttpStatus.CREATED).body(exercise);
  }

  @PutMapping("/{exerciseId}")
  public ResponseEntity<ExerciseResponse> updateExercise(
      @PathVariable Long workoutId,
      @PathVariable Long exerciseId,
      @Valid @RequestBody UpdateExerciseRequest request,
      Authentication authentication) {
    ExerciseResponse exercise = exerciseService.updateExercise(exerciseId, request, authentication);
    return ResponseEntity.ok(exercise);
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