package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.AuthResponse;
import de.mornhinweg.trainingbackend.dto.LoginRequest;
import de.mornhinweg.trainingbackend.dto.RefreshTokenRequest;
import de.mornhinweg.trainingbackend.dto.RegisterRequest;
import de.mornhinweg.trainingbackend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth", description = "Register, log in, refresh and revoke tokens, and the current user")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  // An empty @SecurityRequirements marks an endpoint as public in the API docs
  @SecurityRequirements
  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
  }

  @SecurityRequirements
  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
  }

  @Operation(summary = "Exchange a refresh token for new tokens",
      description = "Refresh tokens are single use: each call returns a new one and revokes the old.")
  @SecurityRequirements
  @PostMapping("/refresh")
  public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
    return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
  }

  @Operation(summary = "Revoke a refresh token")
  @SecurityRequirements
  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
    authService.logout(request.getRefreshToken());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/me")
  public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.ok(authService.getMe(userDetails.getUsername()));
  }
}
