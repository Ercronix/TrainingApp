package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.StretchCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StretchCheckInRepository extends JpaRepository<StretchCheckIn, Long> {

  @Query("SELECT c.day FROM StretchCheckIn c WHERE c.user.id = :userId ORDER BY c.day ASC")
  List<LocalDate> findDaysByUserId(@Param("userId") Long userId);

  boolean existsByUserIdAndDay(Long userId, LocalDate day);

  // Idempotent, also when the same day is checked in twice at once (a replayed offline mutation)
  @Modifying
  @Query(value = "INSERT INTO stretch_check_ins (user_id, day) VALUES (:userId, :day) ON CONFLICT (user_id, day) DO NOTHING",
      nativeQuery = true)
  void insertIgnoringDuplicate(@Param("userId") Long userId, @Param("day") LocalDate day);

  @Modifying
  @Query("DELETE FROM StretchCheckIn c WHERE c.user.id = :userId AND c.day = :day")
  void deleteByUserIdAndDay(@Param("userId") Long userId, @Param("day") LocalDate day);
}
