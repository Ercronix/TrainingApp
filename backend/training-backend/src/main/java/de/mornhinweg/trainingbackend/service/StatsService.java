package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.stats.StatsResponse;
import de.mornhinweg.trainingbackend.dto.stats.StatsResponse.RangeValues;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.TrainingLog;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.ExerciseLogRepository;
import de.mornhinweg.trainingbackend.repository.TrainingLogRepository;
import de.mornhinweg.trainingbackend.repository.TrainingLogRepository.RangeTotals;
import de.mornhinweg.trainingbackend.repository.TrainingLogRepository.WeekdayCount;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StatsService {

  private final TrainingLogRepository trainingLogRepository;
  private final ExerciseLogRepository exerciseLogRepository;
  private final UserRepository userRepository;

  /**
   * @param timeZone the user's IANA time zone (e.g. "Europe/Berlin"), used to decide which
   *                 calendar day a session belongs to. Defaults to the server's zone.
   */
  @Transactional(readOnly = true)
  public StatsResponse getStats(String timeZone, Authentication authentication) {
    User user = getCurrentUser(authentication);
    ZoneId serverZone = ZoneId.systemDefault();
    ZoneId zone = parseZone(timeZone, serverZone);

    // started_at is stored as a local time in the server's zone
    LocalDateTime now = LocalDateTime.now(serverZone);
    RangeTotals totals = trainingLogRepository.sumRangeTotals(
        user.getId(), now.minusDays(7), now.minusDays(30), now.minusDays(365));

    RangeValues sessions = new RangeValues(
        totals.getWeekSessions(), totals.getMonthSessions(), totals.getYearSessions());
    RangeValues volume = new RangeValues(
        round(totals.getWeekVolume()), round(totals.getMonthVolume()), round(totals.getYearVolume()));

    List<LocalDate> trainingDays = trainingLogRepository
        .findTrainingDays(user.getId(), serverZone.getId(), zone.getId())
        .stream().map(LocalDate::parse).toList();

    WeekdayCount mostActive = trainingLogRepository
        .countSessionsByWeekday(user.getId(), serverZone.getId(), zone.getId())
        .stream()
        // Most sessions first; ties go to the earlier weekday
        .max(Comparator.comparingLong(WeekdayCount::getSessions)
            .thenComparing(WeekdayCount::getIsoDow, Comparator.reverseOrder()))
        .orElse(null);

    return StatsResponse.builder()
        .sessions(sessions)
        .volume(volume)
        .durationSeconds(new RangeValues(
            totals.getWeekDuration(), totals.getMonthDuration(), totals.getYearDuration()))
        .averageVolume(new RangeValues(
            average(volume.getWeek(), sessions.getWeek()),
            average(volume.getMonth(), sessions.getMonth()),
            average(volume.getYear(), sessions.getYear())))
        .streak(calculateStreak(trainingDays, LocalDate.now(zone)))
        .mostActiveDay(mostActive != null ? DayOfWeek.of(mostActive.getIsoDow()) : null)
        .mostActiveDaySessions(mostActive != null ? mostActive.getSessions() : 0)
        .lastSession(trainingLogRepository
            .findFirstByUserIdAndCompletedAtIsNotNullOrderByStartedAtDesc(user.getId())
            .map(this::toLastSession)
            .orElse(null))
        .build();
  }

  /** @param trainingDays distinct days with a session, ascending */
  static StatsResponse.Streak calculateStreak(List<LocalDate> trainingDays, LocalDate today) {
    Set<LocalDate> days = new HashSet<>(trainingDays);

    // A streak stays alive until the end of today, so start from yesterday if today is still open
    LocalDate day = days.contains(today) ? today : today.minusDays(1);
    int current = 0;
    while (days.contains(day)) {
      current++;
      day = day.minusDays(1);
    }

    int longest = 0;
    int run = 0;
    LocalDate previous = null;
    for (LocalDate d : trainingDays) {
      run = previous != null && previous.plusDays(1).equals(d) ? run + 1 : 1;
      longest = Math.max(longest, run);
      previous = d;
    }

    List<StatsResponse.Day> last7Days = new ArrayList<>(7);
    for (int i = 6; i >= 0; i--) {
      LocalDate d = today.minusDays(i);
      last7Days.add(new StatsResponse.Day(d, days.contains(d)));
    }

    return StatsResponse.Streak.builder()
        .current(current)
        .longest(longest)
        .last7Days(last7Days)
        .build();
  }

  private StatsResponse.LastSession toLastSession(TrainingLog log) {
    return StatsResponse.LastSession.builder()
        .id(log.getId())
        .workoutName(log.getWorkout().getName())
        .splitName(log.getSplit().getName())
        .startedAt(log.getStartedAt())
        .exerciseCount(exerciseLogRepository.countByTrainingLogId(log.getId()))
        .build();
  }

  private static ZoneId parseZone(String timeZone, ZoneId fallback) {
    if (timeZone == null || timeZone.isBlank()) return fallback;
    // Only accept tz database region IDs: Postgres reads offset IDs like "+02:00" with
    // the opposite (POSIX) sign
    if (!ZoneId.getAvailableZoneIds().contains(timeZone)) {
      throw new BadRequestException("Unknown time zone: " + timeZone);
    }
    return ZoneId.of(timeZone);
  }

  private static long round(BigDecimal value) {
    return value.setScale(0, RoundingMode.HALF_UP).longValue();
  }

  private static long average(long total, long count) {
    return count > 0 ? Math.round((double) total / count) : 0;
  }

  private User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }
}
