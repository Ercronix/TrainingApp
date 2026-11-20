package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.training.*;
import de.mornhinweg.trainingbackend.service.TrainingLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Training logs", description = "Workout sessions: start one from a workout, log sets, complete it, and the history")
@RestController
@RequestMapping("/api/training-logs")
@RequiredArgsConstructor
public class TrainingLogController {

  private final TrainingLogService trainingLogService;

  @Operation(summary = "Start a session from a workout")
  @PostMapping("/start")
  public ResponseEntity<TrainingLogResponse> startTraining(
      @Valid @RequestBody StartTrainingRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(trainingLogService.startTraining(request, authentication));
  }

  @PutMapping("/exercise-logs/{exerciseLogId}")
  public ResponseEntity<ExerciseLogResponse> updateExerciseLog(
      @PathVariable Long exerciseLogId,
      @Valid @RequestBody UpdateExerciseLogRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.updateExerciseLog(exerciseLogId, request, authentication));
  }

  @Operation(summary = "Swap a running session's exercise for another, for this session only")
  @PutMapping("/exercise-logs/{exerciseLogId}/replace")
  public ResponseEntity<ExerciseLogResponse> replaceExerciseLog(
      @PathVariable Long exerciseLogId,
      @Valid @RequestBody ReplaceExerciseLogRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.replaceExerciseLog(exerciseLogId, request, authentication));
  }

  @DeleteMapping("/exercise-logs/{exerciseLogId}")
  public ResponseEntity<Void> deleteExerciseLog(
      @PathVariable Long exerciseLogId,
      Authentication authentication) {
    trainingLogService.deleteExerciseLog(exerciseLogId, authentication);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{trainingLogId}/exercise-logs")
  public ResponseEntity<ExerciseLogResponse> addExerciseLog(
      @PathVariable Long trainingLogId,
      @Valid @RequestBody AddExerciseLogRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(trainingLogService.addExerciseLog(trainingLogId, request, authentication));
  }

  @PutMapping("/{id}/complete")
  public ResponseEntity<TrainingLogResponse> completeTraining(
      @PathVariable Long id,
      @Valid @RequestBody CompleteTrainingRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.completeTraining(id, request, authentication));
  }

  @Operation(summary = "Set a session's 1-5 ratings (feel, energy, sleep) and note, replacing them; null clears one")
  @PutMapping("/{id}/review")
  public ResponseEntity<TrainingLogResponse> updateReview(
      @PathVariable Long id,
      @Valid @RequestBody UpdateTrainingReviewRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.updateReview(id, request, authentication));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteTraining(
      @PathVariable Long id,
      Authentication authentication) {
    trainingLogService.deleteTraining(id, authentication);
    return ResponseEntity.noContent().build();
  }

  @GetMapping
  public ResponseEntity<List<TrainingLogResponse>> getAllTrainings(Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.getAllTrainings(authentication));
  }

  @Operation(summary = "Sessions that are not completed yet, newest first")
  @GetMapping("/active")
  public ResponseEntity<List<TrainingLogResponse>> getActiveTrainings(Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.getActiveTrainings(authentication));
  }

  @GetMapping("/{id}")
  public ResponseEntity<TrainingLogResponse> getTraining(
      @PathVariable Long id,
      Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.getTraining(id, authentication));
  }
}
