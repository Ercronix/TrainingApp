package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.exercise.ExerciseProgressResponse;
import de.mornhinweg.trainingbackend.dto.library.CreateLibraryExerciseRequest;
import de.mornhinweg.trainingbackend.dto.library.LibraryExerciseResponse;
import de.mornhinweg.trainingbackend.dto.library.UpdateLibraryExerciseRequest;
import de.mornhinweg.trainingbackend.service.LibraryExerciseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Library", description = "The user's exercise library (name, notes, video, muscles), shared across workouts")
@RestController
@RequestMapping("/api/library-exercises")
@RequiredArgsConstructor
public class LibraryExerciseController {

  private final LibraryExerciseService libraryExerciseService;

  @GetMapping
  public ResponseEntity<List<LibraryExerciseResponse>> getLibrary(Authentication authentication) {
    return ResponseEntity.ok(libraryExerciseService.getLibrary(authentication));
  }

  @PostMapping
  public ResponseEntity<LibraryExerciseResponse> createLibraryExercise(
      @Valid @RequestBody CreateLibraryExerciseRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(libraryExerciseService.createLibraryExercise(request, authentication));
  }

  @PutMapping("/{id}")
  public ResponseEntity<LibraryExerciseResponse> updateLibraryExercise(
      @PathVariable Long id,
      @Valid @RequestBody UpdateLibraryExerciseRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(libraryExerciseService.updateLibraryExercise(id, request, authentication));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteLibraryExercise(
      @PathVariable Long id,
      Authentication authentication) {
    libraryExerciseService.deleteLibraryExercise(id, authentication);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Progress history of a library entry across all workouts")
  @GetMapping("/{id}/progress")
  public ResponseEntity<ExerciseProgressResponse> getProgress(
      @PathVariable Long id,
      Authentication authentication) {
    return ResponseEntity.ok(libraryExerciseService.getProgress(id, authentication));
  }
}
