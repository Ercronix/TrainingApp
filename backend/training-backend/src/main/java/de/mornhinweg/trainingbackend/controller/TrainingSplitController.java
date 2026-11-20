package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.split.CreateSplitRequest;
import de.mornhinweg.trainingbackend.dto.split.RestartMesocycleRequest;
import de.mornhinweg.trainingbackend.dto.split.SplitResponse;
import de.mornhinweg.trainingbackend.dto.split.UpdateSplitRequest;
import de.mornhinweg.trainingbackend.service.TrainingSplitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Splits", description = "Training splits; one per user is active and tracks the current block and an optional mesocycle")
@RestController
@RequestMapping("/api/splits")
@RequiredArgsConstructor
public class TrainingSplitController {

  private final TrainingSplitService trainingSplitService;

  @GetMapping
  public ResponseEntity<List<SplitResponse>> getAllSplits(Authentication authentication) {
    return ResponseEntity.ok(trainingSplitService.getAllSplits(authentication));
  }

  @GetMapping("/active")
  public ResponseEntity<SplitResponse> getActiveSplit(Authentication authentication) {
    return ResponseEntity.ok(trainingSplitService.getActiveSplit(authentication));
  }

  @PostMapping
  public ResponseEntity<SplitResponse> createSplit(
      @Valid @RequestBody CreateSplitRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED).body(trainingSplitService.createSplit(request, authentication));
  }

  @PutMapping("/{id}")
  public ResponseEntity<SplitResponse> updateSplit(
      @PathVariable Long id,
      @Valid @RequestBody UpdateSplitRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(trainingSplitService.updateSplit(id, request, authentication));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteSplit(
      @PathVariable Long id,
      Authentication authentication) {
    trainingSplitService.deleteSplit(id, authentication);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Restart the split's mesocycle",
      description = "`startDate` (the client's local date, yyyy-MM-dd) becomes the first day of week 1; the server's date when omitted.")
  @PostMapping("/{id}/mesocycle/restart")
  public ResponseEntity<SplitResponse> restartMesocycle(
      @PathVariable Long id,
      @RequestBody(required = false) RestartMesocycleRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(trainingSplitService.restartMesocycle(id, request, authentication));
  }

  @PutMapping("/{id}/activate")
  public ResponseEntity<SplitResponse> activateSplit(
      @PathVariable Long id,
      Authentication authentication) {
    return ResponseEntity.ok(trainingSplitService.activateSplit(id, authentication));
  }
}
