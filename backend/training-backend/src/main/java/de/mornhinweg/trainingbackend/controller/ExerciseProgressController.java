package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.exercise.ExerciseProgressResponse;
import de.mornhinweg.trainingbackend.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseProgressController {

  private final ExerciseService exerciseService;

  @GetMapping("/{exerciseId}/progress")
  public ResponseEntity<ExerciseProgressResponse> getProgress(
      @PathVariable Long exerciseId,
      Authentication authentication) {
    return ResponseEntity.ok(exerciseService.getProgress(exerciseId, authentication));
  }
}