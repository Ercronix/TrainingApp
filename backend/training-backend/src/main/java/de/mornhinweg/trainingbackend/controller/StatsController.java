package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.stats.StatsResponse;
import de.mornhinweg.trainingbackend.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Stats", description = "Dashboard statistics over completed sessions")
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

  private final StatsService statsService;

  @Operation(summary = "Dashboard statistics",
      description = "Sessions, volume and duration over the last 7, 30 and 365 days, streaks and the last session. "
          + "`tz` is an IANA time zone (e.g. Europe/Berlin) for day boundaries; the server's zone when omitted.")
  @GetMapping
  public ResponseEntity<StatsResponse> getStats(
      @RequestParam(required = false) String tz,
      Authentication authentication) {
    return ResponseEntity.ok(statsService.getStats(tz, authentication));
  }
}
