package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.workout.CreateWorkoutRequest;
import de.mornhinweg.trainingbackend.dto.workout.UpdateWorkoutRequest;
import de.mornhinweg.trainingbackend.dto.workout.WorkoutResponse;
import de.mornhinweg.trainingbackend.service.WorkoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
public class WorkoutController {

  private final WorkoutService workoutService;

  @GetMapping("/split/{splitId}")
  public ResponseEntity<List<WorkoutResponse>> getWorkoutsBySplit(
      @PathVariable Long splitId,
      Authentication authentication) {
    return ResponseEntity.ok(workoutService.getWorkoutsBySplit(splitId, authentication));
  }

  @PostMapping("/split/{splitId}")
  public ResponseEntity<WorkoutResponse> createWorkout(
      @PathVariable Long splitId,
      @Valid @RequestBody CreateWorkoutRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(workoutService.createWorkout(splitId, request, authentication));
  }

  @GetMapping("/{id}")
  public ResponseEntity<WorkoutResponse> getWorkout(
      @PathVariable Long id,
      Authentication authentication) {
    try {
      return ResponseEntity.ok(workoutService.getWorkout(id, authentication));
    } catch (RuntimeException e) {
      if (e.getMessage().equals("Unauthorized")) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  @PutMapping("/{id}")
  public ResponseEntity<WorkoutResponse> updateWorkout(
      @PathVariable Long id,
      @Valid @RequestBody UpdateWorkoutRequest request,
      Authentication authentication) {
    try {
      return ResponseEntity.ok(workoutService.updateWorkout(id, request, authentication));
    } catch (RuntimeException e) {
      if (e.getMessage().equals("Unauthorized")) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteWorkout(
      @PathVariable Long id,
      Authentication authentication) {
    try {
      workoutService.deleteWorkout(id, authentication);
      return ResponseEntity.noContent().build();
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }
}