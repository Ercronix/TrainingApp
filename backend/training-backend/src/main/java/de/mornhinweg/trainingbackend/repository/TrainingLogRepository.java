package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.TrainingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingLogRepository extends JpaRepository<TrainingLog, Long> {

  List<TrainingLog> findByUserIdOrderByStartedAtDesc(Long userId);

  List<TrainingLog> findByUserIdAndCompletedAtIsNullOrderByStartedAtDesc(Long userId);

  List<TrainingLog> findByUserIdAndStartedAtBetweenOrderByStartedAtDesc(
      Long userId, LocalDateTime start, LocalDateTime end);

  Optional<TrainingLog> findByIdAndUserId(Long id, Long userId);

  List<TrainingLog> findByWorkoutIdOrderByStartedAtDesc(Long workoutId);

  Optional<TrainingLog> findFirstByUserIdAndCompletedAtIsNotNullOrderByStartedAtDesc(Long userId);

  // ── Dashboard stats ──────────────────────────────────────────
  // Only completed sessions count. Volume is weight × sets × reps of completed
  // exercise logs whose library entry is rep based (timed exercises are skipped).
  // Timestamps are stored in the server's zone; day-level grouping converts them
  // from :serverZone to the user's :zone first.

  interface RangeTotals {
    long getWeekSessions();
    long getMonthSessions();
    long getYearSessions();
    BigDecimal getWeekVolume();
    BigDecimal getMonthVolume();
    BigDecimal getYearVolume();
    long getWeekDuration();
    long getMonthDuration();
    long getYearDuration();
  }

  @Query(nativeQuery = true, value = """
      SELECT COUNT(*) FILTER (WHERE s.started_at >= :weekStart)                     AS "weekSessions",
             COUNT(*) FILTER (WHERE s.started_at >= :monthStart)                    AS "monthSessions",
             COUNT(*)                                                               AS "yearSessions",
             COALESCE(SUM(s.volume) FILTER (WHERE s.started_at >= :weekStart), 0)   AS "weekVolume",
             COALESCE(SUM(s.volume) FILTER (WHERE s.started_at >= :monthStart), 0)  AS "monthVolume",
             COALESCE(SUM(s.volume), 0)                                             AS "yearVolume",
             COALESCE(SUM(s.duration) FILTER (WHERE s.started_at >= :weekStart), 0) AS "weekDuration",
             COALESCE(SUM(s.duration) FILTER (WHERE s.started_at >= :monthStart), 0) AS "monthDuration",
             COALESCE(SUM(s.duration), 0)                                           AS "yearDuration"
      FROM (
        SELECT tl.started_at,
               COALESCE(tl.duration_seconds, 0) AS duration,
               (SELECT SUM(el.weight_used * el.sets_completed * el.reps_completed)
                FROM exercise_logs el
                JOIN exercises e ON e.id = el.exercise_id
                JOIN library_exercises le ON le.id = e.library_exercise_id
                WHERE el.training_log_id = tl.id
                  AND el.completed
                  AND le.rep_unit = 'reps') AS volume
        FROM training_logs tl
        WHERE tl.user_id = :userId
          AND tl.completed_at IS NOT NULL
          AND tl.started_at >= :yearStart
      ) s
      """)
  RangeTotals sumRangeTotals(@Param("userId") Long userId,
                             @Param("weekStart") LocalDateTime weekStart,
                             @Param("monthStart") LocalDateTime monthStart,
                             @Param("yearStart") LocalDateTime yearStart);

  /** Distinct days (yyyy-MM-dd, in the user's zone) with a completed session, ascending. */
  @Query(nativeQuery = true, value = """
      SELECT DISTINCT to_char((tl.started_at AT TIME ZONE :serverZone) AT TIME ZONE :zone, 'YYYY-MM-DD') AS day
      FROM training_logs tl
      WHERE tl.user_id = :userId
        AND tl.completed_at IS NOT NULL
      ORDER BY day
      """)
  List<String> findTrainingDays(@Param("userId") Long userId,
                                @Param("serverZone") String serverZone,
                                @Param("zone") String zone);

  interface WeekdayCount {
    int getIsoDow();
    long getSessions();
  }

  /** Completed sessions per ISO weekday (1 = Monday) in the user's zone. */
  @Query(nativeQuery = true, value = """
      SELECT CAST(EXTRACT(ISODOW FROM (tl.started_at AT TIME ZONE :serverZone) AT TIME ZONE :zone) AS int) AS "isoDow",
             COUNT(*) AS sessions
      FROM training_logs tl
      WHERE tl.user_id = :userId
        AND tl.completed_at IS NOT NULL
      GROUP BY 1
      """)
  List<WeekdayCount> countSessionsByWeekday(@Param("userId") Long userId,
                                            @Param("serverZone") String serverZone,
                                            @Param("zone") String zone);
}
