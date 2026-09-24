package de.mornhinweg.trainingbackend.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Dashboard statistics over completed sessions. Ranges are rolling windows of the
 * last 7, 30 and 365 days. Volume is in kg and only counts rep-based exercises.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsResponse {

  private RangeValues sessions;
  private RangeValues volume;
  private RangeValues durationSeconds;
  private RangeValues averageVolume;

  private Streak streak;

  /** Weekday with the most sessions of all time, or null when there are none. */
  private DayOfWeek mostActiveDay;
  private long mostActiveDaySessions;

  private LastSession lastSession;

  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  public static class RangeValues {
    private long week;
    private long month;
    private long year;
  }

  @Data
  @Builder
  @AllArgsConstructor
  @NoArgsConstructor
  public static class Streak {
    /** Consecutive training days ending today, or yesterday if today has no session yet. */
    private int current;
    private int longest;
    /** The last seven days in the user's time zone, oldest first and ending today. */
    private List<Day> last7Days;
  }

  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  public static class Day {
    private LocalDate date;
    private boolean trained;
  }

  @Data
  @Builder
  @AllArgsConstructor
  @NoArgsConstructor
  public static class LastSession {
    private Long id;
    private String workoutName;
    private String splitName;
    private LocalDateTime startedAt;
    private long exerciseCount;
  }
}
