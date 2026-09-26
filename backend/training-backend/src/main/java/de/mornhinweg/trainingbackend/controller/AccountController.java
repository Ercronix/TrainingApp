package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.AuthResponse;
import de.mornhinweg.trainingbackend.dto.account.ChangePasswordRequest;
import de.mornhinweg.trainingbackend.dto.account.DeleteAccountRequest;
import de.mornhinweg.trainingbackend.dto.account.UpdateAccountRequest;
import de.mornhinweg.trainingbackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

  private final AuthService authService;

  @PutMapping
  public ResponseEntity<AuthResponse> updateAccount(
      @Valid @RequestBody UpdateAccountRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(authService.updateAccount(request, authentication));
  }

  @PutMapping("/password")
  public ResponseEntity<AuthResponse> changePassword(
      @Valid @RequestBody ChangePasswordRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(authService.changePassword(request, authentication));
  }

  @DeleteMapping
  public ResponseEntity<Void> deleteAccount(
      @Valid @RequestBody DeleteAccountRequest request,
      Authentication authentication) {
    authService.deleteAccount(request, authentication);
    return ResponseEntity.noContent().build();
  }
}
