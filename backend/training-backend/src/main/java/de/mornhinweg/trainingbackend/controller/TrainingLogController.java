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
    TrainingLogResponse training = trainingLogService.startTraining(request, authentication);
    return ResponseEntity.status(HttpStatus.CREATED).body(training);
  }

  @PutMapping("/exercise-logs/{exerciseLogId}")
  public ResponseEntity<ExerciseLogResponse> updateExerciseLog(
      @PathVariable Long exerciseLogId,
      @RequestBody UpdateExerciseLogRequest request,
      Authentication authentication) {
    ExerciseLogResponse exercise = trainingLogService.updateExerciseLog(exerciseLogId, request, authentication);
    return ResponseEntity.ok(exercise);
  }

  @PutMapping("/{id}/complete")
  public ResponseEntity<TrainingLogResponse> completeTraining(
      @PathVariable Long id,
      @RequestBody CompleteTrainingRequest request,
      Authentication authentication) {
    TrainingLogResponse training = trainingLogService.completeTraining(id, request, authentication);
    return ResponseEntity.ok(training);
  }

  @GetMapping
  public ResponseEntity<List<TrainingLogResponse>> getAllTrainings(Authentication authentication) {
    List<TrainingLogResponse> trainings = trainingLogService.getAllTrainings(authentication);
    return ResponseEntity.ok(trainings);
  }

  @GetMapping("/active")
  public ResponseEntity<List<TrainingLogResponse>> getActiveTrainings(Authentication authentication) {
    List<TrainingLogResponse> trainings = trainingLogService.getActiveTrainings(authentication);
    return ResponseEntity.ok(trainings);
  }

  @GetMapping("/{id}")
  public ResponseEntity<TrainingLogResponse> getTraining(
      @PathVariable Long id,
      Authentication authentication) {
    TrainingLogResponse training = trainingLogService.getTraining(id, authentication);
    return ResponseEntity.ok(training);
  }
}