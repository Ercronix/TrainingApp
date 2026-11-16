package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.exercise.ExerciseProgressResponse;
import de.mornhinweg.trainingbackend.service.ExerciseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Workout exercises")
@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseProgressController {

  private final ExerciseService exerciseService;

  @Operation(summary = "Progress history of a workout exercise",
      description = "Aggregated over every session of the exercise's library entry.")
  @GetMapping("/{exerciseId}/progress")
  public ResponseEntity<ExerciseProgressResponse> getProgress(
      @PathVariable Long exerciseId,
      Authentication authentication) {
    return ResponseEntity.ok(exerciseService.getProgress(exerciseId, authentication));
  }
}