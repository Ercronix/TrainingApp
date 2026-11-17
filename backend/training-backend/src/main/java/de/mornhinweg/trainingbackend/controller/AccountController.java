package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.AuthResponse;
import de.mornhinweg.trainingbackend.dto.account.ChangePasswordRequest;
import de.mornhinweg.trainingbackend.dto.account.DeleteAccountRequest;
import de.mornhinweg.trainingbackend.dto.account.UpdateAccountRequest;
import de.mornhinweg.trainingbackend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Account", description = "Change the signed-in user's username, email or password, or delete the account")
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

  private final AuthService authService;

  @Operation(summary = "Change username and email", description = "Needs the current password.")
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
