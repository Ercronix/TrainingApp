package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.BodyWeightEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BodyWeightEntryRepository extends JpaRepository<BodyWeightEntry, Long> {

  List<BodyWeightEntry> findByUserIdOrderByDayAsc(Long userId);

  List<BodyWeightEntry> findByUserIdAndDayBetweenOrderByDayAsc(Long userId, LocalDate from, LocalDate to);

  Optional<BodyWeightEntry> findByUserIdAndDay(Long userId, LocalDate day);

  // Insert or replace in one statement, so two writes for the same day at once (a replayed
  // offline mutation next to a live one) can't trip the unique constraint
  @Modifying(clearAutomatically = true)
  @Query(value = """
      INSERT INTO body_weight_entries (user_id, day, weight, note)
      VALUES (:userId, :day, :weight, :note)
      ON CONFLICT (user_id, day)
      DO UPDATE SET weight = EXCLUDED.weight, note = EXCLUDED.note, updated_at = CURRENT_TIMESTAMP
      """, nativeQuery = true)
  void upsert(@Param("userId") Long userId, @Param("day") LocalDate day,
      @Param("weight") BigDecimal weight, @Param("note") String note);

  @Modifying
  @Query("DELETE FROM BodyWeightEntry e WHERE e.user.id = :userId AND e.day = :day")
  void deleteByUserIdAndDay(@Param("userId") Long userId, @Param("day") LocalDate day);
}
