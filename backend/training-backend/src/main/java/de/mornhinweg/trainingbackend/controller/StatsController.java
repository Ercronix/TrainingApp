package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.stats.StatsResponse;
import de.mornhinweg.trainingbackend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

  private final StatsService statsService;

  @GetMapping
  public ResponseEntity<StatsResponse> getStats(
      @RequestParam(required = false) String tz,
      Authentication authentication) {
    return ResponseEntity.ok(statsService.getStats(tz, authentication));
  }
}
