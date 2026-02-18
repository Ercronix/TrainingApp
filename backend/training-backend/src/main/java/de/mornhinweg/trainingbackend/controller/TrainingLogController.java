package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.training.*;
import de.mornhinweg.trainingbackend.service.TrainingLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/training-logs")
@RequiredArgsConstructor
public class TrainingLogController {

  private final TrainingLogService trainingLogService;

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
      @RequestBody UpdateExerciseLogRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.updateExerciseLog(exerciseLogId, request, authentication));
  }

  @PutMapping("/{id}/complete")
  public ResponseEntity<TrainingLogResponse> completeTraining(
      @PathVariable Long id,
      @RequestBody CompleteTrainingRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(trainingLogService.completeTraining(id, request, authentication));
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