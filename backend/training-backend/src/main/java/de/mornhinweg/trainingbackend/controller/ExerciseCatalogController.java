package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.catalog.CatalogExerciseResponse;
import de.mornhinweg.trainingbackend.service.ExerciseCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercise-catalog")
@RequiredArgsConstructor
public class ExerciseCatalogController {

  private final ExerciseCatalogService exerciseCatalogService;

  // The whole catalog (a few hundred entries), so clients can search it offline
  @GetMapping
  public ResponseEntity<List<CatalogExerciseResponse>> getCatalog() {
    return ResponseEntity.ok(exerciseCatalogService.getCatalog());
  }
}
