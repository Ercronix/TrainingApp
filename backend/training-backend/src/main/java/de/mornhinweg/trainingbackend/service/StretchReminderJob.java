package de.mornhinweg.trainingbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** Checks once a minute for stretch reminders that are due. */
@Component
@RequiredArgsConstructor
public class StretchReminderJob {

  private final StretchReminderService reminderService;

  @Scheduled(cron = "0 * * * * *")
  public void sendDueReminders() {
    reminderService.sendDueReminders(Instant.now());
  }
}
