package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.catalog.CatalogExerciseResponse;
import de.mornhinweg.trainingbackend.service.ExerciseCatalogService;
import de.mornhinweg.trainingbackend.service.ExerciseIllustrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/exercise-catalog")
@RequiredArgsConstructor
public class ExerciseCatalogController {

  private final ExerciseCatalogService exerciseCatalogService;
  private final ExerciseIllustrationService exerciseIllustrationService;

  // The whole catalog (a few hundred entries), so clients can search it offline
  @GetMapping
  public ResponseEntity<List<CatalogExerciseResponse>> getCatalog() {
    return ResponseEntity.ok(exerciseCatalogService.getCatalog());
  }

  // The drawing of the exercise as SVG: 0 is the start pose, 1 the end. It never changes
  @GetMapping("/{id}/illustrations/{index}")
  public ResponseEntity<String> getIllustration(@PathVariable Long id, @PathVariable int index) {
    return ResponseEntity.ok()
        .contentType(MediaType.valueOf("image/svg+xml"))
        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePrivate().immutable())
        .body(exerciseIllustrationService.getIllustration(id, index));
  }
}
