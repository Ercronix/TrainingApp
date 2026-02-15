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
    List<SplitResponse> splits = trainingSplitService.getAllSplits(authentication);
    return ResponseEntity.ok(splits);
  }

  @GetMapping("/active")
  public ResponseEntity<SplitResponse> getActiveSplit(Authentication authentication) {
    try {
      SplitResponse split = trainingSplitService.getActiveSplit(authentication);
      return ResponseEntity.ok(split);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  @PostMapping
  public ResponseEntity<SplitResponse> createSplit(
      @Valid @RequestBody CreateSplitRequest request,
      Authentication authentication) {
    SplitResponse split = trainingSplitService.createSplit(request, authentication);
    return ResponseEntity.status(HttpStatus.CREATED).body(split);
  }

  @PutMapping("/{id}")
  public ResponseEntity<SplitResponse> updateSplit(
      @PathVariable Long id,
      @Valid @RequestBody UpdateSplitRequest request,
      Authentication authentication) {
    try {
      SplitResponse split = trainingSplitService.updateSplit(id, request, authentication);
      return ResponseEntity.ok(split);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteSplit(
      @PathVariable Long id,
      Authentication authentication) {
    try {
      trainingSplitService.deleteSplit(id, authentication);
      return ResponseEntity.noContent().build();
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }

  @PutMapping("/{id}/activate")
  public ResponseEntity<SplitResponse> activateSplit(
      @PathVariable Long id,
      Authentication authentication) {
    try {
      SplitResponse split = trainingSplitService.activateSplit(id, authentication);
      return ResponseEntity.ok(split);
    } catch (RuntimeException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
  }
}