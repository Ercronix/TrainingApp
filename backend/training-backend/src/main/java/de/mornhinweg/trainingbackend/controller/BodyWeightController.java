package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.bodyweight.BodyWeightRequest;
import de.mornhinweg.trainingbackend.dto.bodyweight.BodyWeightResponse;
import de.mornhinweg.trainingbackend.service.BodyWeightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Body weight", description = "Daily body weight log, one entry per day")
@RestController
@RequestMapping("/api/body-weight")
@RequiredArgsConstructor
public class BodyWeightController {

  private final BodyWeightService bodyWeightService;

  @Operation(summary = "Body weight entries, ascending by date",
      description = "`from` and `to` (yyyy-MM-dd, inclusive) optionally limit the range.")
  @GetMapping
  public ResponseEntity<List<BodyWeightResponse>> getEntries(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      Authentication authentication) {
    return ResponseEntity.ok(bodyWeightService.getEntries(from, to, authentication));
  }

  @Operation(summary = "Log the weight for a day, replacing that day's entry",
      description = "`date` is the client's local date (yyyy-MM-dd); weight is in kg.")
  @PutMapping("/{date}")
  public ResponseEntity<BodyWeightResponse> upsert(
      @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      @Valid @RequestBody BodyWeightRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(bodyWeightService.upsert(date, request, authentication));
  }

  @Operation(summary = "Delete the entry for a day", description = "Succeeds also when there is none.")
  @DeleteMapping("/{date}")
  public ResponseEntity<Void> delete(
      @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      Authentication authentication) {
    bodyWeightService.delete(date, authentication);
    return ResponseEntity.noContent().build();
  }
}
