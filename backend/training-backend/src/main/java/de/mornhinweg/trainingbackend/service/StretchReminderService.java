package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.stretch.StretchReminderResponse;
import de.mornhinweg.trainingbackend.dto.stretch.UpdateStretchReminderRequest;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.StretchItem;
import de.mornhinweg.trainingbackend.model.StretchReminder;
import de.mornhinweg.trainingbackend.model.StretchRoutine;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.notification.NtfyClient;
import de.mornhinweg.trainingbackend.repository.StretchCheckInRepository;
import de.mornhinweg.trainingbackend.repository.StretchReminderRepository;
import de.mornhinweg.trainingbackend.repository.StretchRoutineRepository;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * The daily stretch reminder: an ntfy push at the user's chosen time, skipped on days they
 * already stretched. Its "Done" button checks the day off through a secret token, since the
 * request comes from the ntfy app without a login.
 */
@Slf4j
@Service
public class StretchReminderService {

  static final LocalTime DEFAULT_TIME = LocalTime.of(8, 0);
  // Rough time per repetition, as in the app's routine total
  private static final int SECONDS_PER_REP = 4;
  // Opens the app; the scheme is set in the app's app.json
  private static final String APP_URL = "trainingapp://";
  private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
  private static final SecureRandom RANDOM = new SecureRandom();

  private final StretchReminderRepository reminderRepository;
  private final StretchRoutineRepository routineRepository;
  private final StretchCheckInRepository checkInRepository;
  private final UserRepository userRepository;
  private final NtfyClient ntfy;
  private final String publicUrl;

  public StretchReminderService(
      StretchReminderRepository reminderRepository,
      StretchRoutineRepository routineRepository,
      StretchCheckInRepository checkInRepository,
      UserRepository userRepository,
      NtfyClient ntfy,
      // Where phones reach this server, for the "Done" button; without it there is no button
      @Value("${app.public-url:}") String publicUrl) {
    this.reminderRepository = reminderRepository;
    this.routineRepository = routineRepository;
    this.checkInRepository = checkInRepository;
    this.userRepository = userRepository;
    this.ntfy = ntfy;
    this.publicUrl = publicUrl.replaceAll("/+$", "");
  }

  @Transactional
  public StretchReminderResponse getReminder(Authentication authentication) {
    return toResponse(getOrCreateReminder(getCurrentUser(authentication)));
  }

  @Transactional
  public StretchReminderResponse updateReminder(UpdateStretchReminderRequest request, Authentication authentication) {
    if (request.getEnabled() && !ntfy.isConfigured()) {
      throw new BadRequestException("Reminders aren't set up on this server");
    }
    ZoneId zone = parseZone(request.getTimeZone());
    LocalTime time = LocalTime.parse(request.getTime(), TIME_FORMAT);
    StretchReminder reminder = getOrCreateReminder(getCurrentUser(authentication));
    reminder.setEnabled(request.getEnabled());
    reminder.setRemindAt(time);
    reminder.setTimeZone(zone.getId());
    // A time that already passed today starts tomorrow, rather than sending one right away
    ZonedDateTime now = ZonedDateTime.now(zone);
    if (!now.toLocalTime().isBefore(time)) {
      reminder.setLastSentOn(now.toLocalDate());
    }
    return toResponse(reminderRepository.save(reminder));
  }

  /** Sends a reminder right away, to check the subscription. */
  @Transactional
  public void sendTest(Authentication authentication) {
    if (!ntfy.isConfigured()) {
      throw new BadRequestException("Reminders aren't set up on this server");
    }
    StretchReminder reminder = getOrCreateReminder(getCurrentUser(authentication));
    ntfy.publish(message(reminder));
  }

  /** The notification's "Done" button: checks off the day in the user's zone. */
  @Transactional
  public void checkInFromNotification(String doneToken) {
    StretchReminder reminder = reminderRepository.findByDoneToken(doneToken)
        .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));
    LocalDate today = LocalDate.now(ZoneId.of(reminder.getTimeZone()));
    checkInRepository.insertIgnoringDuplicate(reminder.getUser().getId(), today);
  }

  /** Sends every reminder that is due at `now` and not yet sent that day. */
  public void sendDueReminders(Instant now) {
    if (!ntfy.isConfigured()) return;
    for (StretchReminder reminder : reminderRepository.findAllEnabled()) {
      ZonedDateTime local = now.atZone(ZoneId.of(reminder.getTimeZone()));
      LocalDate today = local.toLocalDate();
      if (today.equals(reminder.getLastSentOn()) || local.toLocalTime().isBefore(reminder.getRemindAt())) {
        continue;
      }
      if (!checkInRepository.existsByUserIdAndDay(reminder.getUser().getId(), today)) {
        try {
          ntfy.publish(message(reminder));
        } catch (RuntimeException e) {
          // Left unmarked, so the next run tries again
          log.warn("Stretch reminder for user {} failed: {}", reminder.getUser().getId(), e.getMessage());
          continue;
        }
      }
      reminder.setLastSentOn(today);
      reminderRepository.save(reminder);
    }
  }

  private NtfyClient.Message message(StretchReminder reminder) {
    List<NtfyClient.Action> actions = new ArrayList<>();
    actions.add(NtfyClient.Action.view("Start", APP_URL + "stretch-session"));
    if (!publicUrl.isBlank()) {
      actions.add(NtfyClient.Action.post("Done", publicUrl + "/api/stretch/reminder/done/" + reminder.getDoneToken()));
    }
    return new NtfyClient.Message(reminder.getTopic(), "Time to stretch", summary(reminder.getUser()),
        APP_URL + "stretch", actions);
  }

  /** "Morning mobility: 6 stretches, about 9 min." */
  private String summary(User user) {
    StretchRoutine routine = routineRepository.findWithItemsByUserId(user.getId()).orElse(null);
    if (routine == null || routine.getItems().isEmpty()) {
      return "Your daily stretch is waiting.";
    }
    List<StretchItem> items = routine.getItems();
    int seconds = items.stream()
        .mapToInt(i -> (StretchItem.HOLD.equals(i.getKind()) ? i.getAmount() : i.getAmount() * SECONDS_PER_REP)
            * (Boolean.TRUE.equals(i.getPerSide()) ? 2 : 1))
        .sum();
    long minutes = Math.max(1, Math.round(seconds / 60.0));
    return String.format("%s: %d %s, about %d min.", routine.getName(), items.size(),
        items.size() == 1 ? "stretch" : "stretches", minutes);
  }

  private StretchReminder getOrCreateReminder(User user) {
    return reminderRepository.findByUserId(user.getId())
        .orElseGet(() -> reminderRepository.save(StretchReminder.builder()
            .user(user)
            .enabled(false)
            .remindAt(DEFAULT_TIME)
            .timeZone("UTC")
            .topic("stretch-" + randomToken(12))
            .doneToken(randomToken(24))
            .build()));
  }

  private StretchReminderResponse toResponse(StretchReminder reminder) {
    boolean available = ntfy.isConfigured();
    return StretchReminderResponse.builder()
        .enabled(reminder.isEnabled())
        .time(reminder.getRemindAt().format(TIME_FORMAT))
        .timeZone(reminder.getTimeZone())
        .available(available)
        .topic(reminder.getTopic())
        .topicUrl(available ? ntfy.topicUrl(reminder.getTopic()) : null)
        .doneButton(!publicUrl.isBlank())
        .build();
  }

  private static ZoneId parseZone(String id) {
    try {
      return ZoneId.of(id);
    } catch (DateTimeException e) {
      throw new BadRequestException("Unknown time zone: " + id);
    }
  }

  // URL- and topic-safe: ntfy topics allow letters, digits, - and _
  private static String randomToken(int bytes) {
    byte[] buffer = new byte[bytes];
    RANDOM.nextBytes(buffer);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
  }

  private User getCurrentUser(Authentication authentication) {
    return userRepository.findByUsername(authentication.getName())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }
}
