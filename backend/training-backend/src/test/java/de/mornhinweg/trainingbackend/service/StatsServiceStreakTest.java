package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.stats.StatsResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class StatsServiceStreakTest {

  private static final LocalDate TODAY = LocalDate.of(2026, 3, 2);

  @Test
  void noSessions() {
    StatsResponse.Streak streak = StatsService.calculateStreak(List.of(), TODAY);
    assertThat(streak.getCurrent()).isZero();
    assertThat(streak.getLongest()).isZero();
    assertThat(streak.getLast7Days()).hasSize(7).noneMatch(StatsResponse.Day::isTrained);
  }

  @Test
  void streakIncludingToday() {
    StatsResponse.Streak streak = StatsService.calculateStreak(
        List.of(TODAY.minusDays(2), TODAY.minusDays(1), TODAY), TODAY);
    assertThat(streak.getCurrent()).isEqualTo(3);
    assertThat(streak.getLongest()).isEqualTo(3);
  }

  @Test
  void streakStaysAliveUntilTodayEnds() {
    StatsResponse.Streak streak = StatsService.calculateStreak(
        List.of(TODAY.minusDays(2), TODAY.minusDays(1)), TODAY);
    assertThat(streak.getCurrent()).isEqualTo(2);
  }

  @Test
  void streakBrokenByMissedDay() {
    StatsResponse.Streak streak = StatsService.calculateStreak(List.of(TODAY.minusDays(2)), TODAY);
    assertThat(streak.getCurrent()).isZero();
    assertThat(streak.getLongest()).isEqualTo(1);
  }

  @Test
  void longestStreakAcrossMonthAndYearBoundaries() {
    // Chronological order matters here; sorting formatted date strings would break these runs
    StatsResponse.Streak streak = StatsService.calculateStreak(List.of(
        LocalDate.of(2025, 12, 30), LocalDate.of(2025, 12, 31), LocalDate.of(2026, 1, 1),
        LocalDate.of(2026, 1, 2), LocalDate.of(2026, 2, 27), LocalDate.of(2026, 3, 1)), TODAY);
    assertThat(streak.getLongest()).isEqualTo(4);
    assertThat(streak.getCurrent()).isEqualTo(1);
  }

  @Test
  void last7DaysEndWithToday() {
    StatsResponse.Streak streak = StatsService.calculateStreak(
        List.of(TODAY.minusDays(6), TODAY), TODAY);
    List<StatsResponse.Day> days = streak.getLast7Days();
    assertThat(days.get(0).getDate()).isEqualTo(TODAY.minusDays(6));
    assertThat(days.get(6).getDate()).isEqualTo(TODAY);
    assertThat(days).extracting(StatsResponse.Day::isTrained)
        .containsExactly(true, false, false, false, false, false, true);
  }
}
