package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.split.CreateSplitRequest;
import de.mornhinweg.trainingbackend.dto.split.SplitResponse;
import de.mornhinweg.trainingbackend.dto.split.UpdateSplitRequest;
import de.mornhinweg.trainingbackend.service.TrainingSplitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

  @PutMapping("/{id}/activate")
  public ResponseEntity<SplitResponse> activateSplit(
      @PathVariable Long id,
      Authentication authentication) {
    return ResponseEntity.ok(trainingSplitService.activateSplit(id, authentication));
  }
}
