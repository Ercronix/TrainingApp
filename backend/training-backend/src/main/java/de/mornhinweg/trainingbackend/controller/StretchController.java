package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.dto.stretch.ReorderStretchItemsRequest;
import de.mornhinweg.trainingbackend.dto.stretch.StretchItemRequest;
import de.mornhinweg.trainingbackend.dto.stretch.StretchItemResponse;
import de.mornhinweg.trainingbackend.dto.stretch.StretchReminderResponse;
import de.mornhinweg.trainingbackend.dto.stretch.StretchRoutineResponse;
import de.mornhinweg.trainingbackend.dto.stretch.UpdateStretchReminderRequest;
import de.mornhinweg.trainingbackend.dto.stretch.UpdateStretchRoutineRequest;
import de.mornhinweg.trainingbackend.service.StretchReminderService;
import de.mornhinweg.trainingbackend.service.StretchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Stretch", description = "Daily stretching routine, check-in days and the ntfy reminder")
@RestController
@RequestMapping("/api/stretch")
@RequiredArgsConstructor
public class StretchController {

  private final StretchService stretchService;
  private final StretchReminderService reminderService;

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
  @Operation(summary = "Days the user stretched, ascending")
  @GetMapping("/check-ins")
  public ResponseEntity<List<LocalDate>> getCheckIns(Authentication authentication) {
    return ResponseEntity.ok(stretchService.getCheckIns(authentication));
  }

  @Operation(summary = "Mark a day as stretched", description = "`day` is the client's local date (yyyy-MM-dd).")
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

  @GetMapping("/reminder")
  public ResponseEntity<StretchReminderResponse> getReminder(Authentication authentication) {
    return ResponseEntity.ok(reminderService.getReminder(authentication));
  }

  @PutMapping("/reminder")
  public ResponseEntity<StretchReminderResponse> updateReminder(
      @Valid @RequestBody UpdateStretchReminderRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(reminderService.updateReminder(request, authentication));
  }

  @Operation(summary = "Send a test reminder notification now")
  @PostMapping("/reminder/test")
  public ResponseEntity<Void> sendTestReminder(Authentication authentication) {
    reminderService.sendTest(authentication);
    return ResponseEntity.noContent().build();
  }

  /** The notification's "Done" button. Public: the token in the path identifies the user. */
  @Operation(summary = "Check in from the reminder's \"Done\" button",
      description = "Public: the secret token in the path, sent in the notification, identifies the user.")
  @SecurityRequirements
  @PostMapping("/reminder/done/{token}")
  public ResponseEntity<Void> checkInFromNotification(@PathVariable String token) {
    reminderService.checkInFromNotification(token);
    return ResponseEntity.noContent().build();
  }
}
