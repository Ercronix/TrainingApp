package de.mornhinweg.trainingbackend.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * Where a date falls in a split's planned mesocycle. Weeks are counted in whole 7-day steps from the
 * start date, and the last week of each cycle is a deload. After the deload the next cycle starts
 * on its own, so a cycle only has to be restarted to move it (after a break, say).
 * Mirrors {@code mesocycleWeek} in the client's {@code utils/mesocycle.ts}.
 */
public final class Mesocycle {

  public static final int MIN_WEEKS = 2;
  public static final int MAX_WEEKS = 12;

  /** Week (1-based) of the cycle, the cycle's length, which cycle it is (1-based), and whether it's the deload. */
  public record Week(int week, int length, int cycle, boolean deload) {}

  private Mesocycle() {}

  /** Empty without a mesocycle, or before it starts. */
  public static Optional<Week> weekOf(Integer length, LocalDate start, LocalDate date) {
    if (length == null || length < 1 || start == null || date == null) return Optional.empty();
    long days = ChronoUnit.DAYS.between(start, date);
    if (days < 0) return Optional.empty();
    long weekIndex = days / 7;
    int week = (int) (weekIndex % length) + 1;
    int cycle = (int) (weekIndex / length) + 1;
    return Optional.of(new Week(week, length, cycle, week == length));
  }

  public static boolean isDeload(Integer length, LocalDate start, LocalDate date) {
    return weekOf(length, start, date).map(Week::deload).orElse(false);
  }
}
