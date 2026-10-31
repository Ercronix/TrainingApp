package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.stretch.ReorderStretchItemsRequest;
import de.mornhinweg.trainingbackend.dto.stretch.StretchItemRequest;
import de.mornhinweg.trainingbackend.dto.stretch.StretchItemResponse;
import de.mornhinweg.trainingbackend.dto.stretch.StretchRoutineResponse;
import de.mornhinweg.trainingbackend.dto.stretch.UpdateStretchRoutineRequest;
import de.mornhinweg.trainingbackend.service.StretchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/stretch")
@RequiredArgsConstructor
public class StretchController {

  private final StretchService stretchService;

  @GetMapping("/routine")
  public ResponseEntity<StretchRoutineResponse> getRoutine(Authentication authentication) {
    return ResponseEntity.ok(stretchService.getRoutine(authentication));
  }

  @PutMapping("/routine")
  public ResponseEntity<StretchRoutineResponse> updateRoutine(
      @Valid @RequestBody UpdateStretchRoutineRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(stretchService.updateRoutine(request, authentication));
  }

  @PostMapping("/items")
  public ResponseEntity<StretchItemResponse> addItem(
      @Valid @RequestBody StretchItemRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED).body(stretchService.addItem(request, authentication));
  }

  @PutMapping("/items/{id}")
  public ResponseEntity<StretchItemResponse> updateItem(
      @PathVariable Long id,
      @Valid @RequestBody StretchItemRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(stretchService.updateItem(id, request, authentication));
  }

  @DeleteMapping("/items/{id}")
  public ResponseEntity<Void> deleteItem(@PathVariable Long id, Authentication authentication) {
    stretchService.deleteItem(id, authentication);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/items/reorder")
  public ResponseEntity<Void> reorderItems(
      @RequestBody ReorderStretchItemsRequest request,
      Authentication authentication) {
    stretchService.reorderItems(request, authentication);
    return ResponseEntity.noContent().build();
  }

  /** Every day the user stretched, ascending. */
  @GetMapping("/check-ins")
  public ResponseEntity<List<LocalDate>> getCheckIns(Authentication authentication) {
    return ResponseEntity.ok(stretchService.getCheckIns(authentication));
  }

  @PutMapping("/check-ins/{day}")
  public ResponseEntity<Void> checkIn(
      @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day,
      Authentication authentication) {
    stretchService.checkIn(day, authentication);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/check-ins/{day}")
  public ResponseEntity<Void> undoCheckIn(
      @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day,
      Authentication authentication) {
    stretchService.undoCheckIn(day, authentication);
    return ResponseEntity.noContent().build();
  }
}
