package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.catalog.CatalogExerciseResponse;
import de.mornhinweg.trainingbackend.service.ExerciseCatalogService;
import de.mornhinweg.trainingbackend.service.ExerciseImageService;
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
  private final ExerciseImageService exerciseImageService;

  // The whole catalog (a few hundred entries), so clients can search it offline
  @GetMapping
  public ResponseEntity<List<CatalogExerciseResponse>> getCatalog() {
    return ResponseEntity.ok(exerciseCatalogService.getCatalog());
  }

  // A photo of the exercise: 0 is the start position, 1 the end. Public, as an <img> on the web
  // can't send the token, and the photos never change
  @GetMapping("/{id}/images/{index}")
  public ResponseEntity<byte[]> getImage(@PathVariable Long id, @PathVariable int index) {
    return ResponseEntity.ok()
        .contentType(MediaType.IMAGE_JPEG)
        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
        .body(exerciseImageService.getImage(id, index));
  }
}
