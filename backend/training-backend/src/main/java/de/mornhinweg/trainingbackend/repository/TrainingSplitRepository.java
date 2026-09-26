package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.TrainingSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingSplitRepository extends JpaRepository<TrainingSplit, Long> {

  // Alle Splits eines Users
  List<TrainingSplit> findByUserIdOrderByCreatedAtDesc(Long userId);

  // Aktiver Split eines Users
  Optional<TrainingSplit> findByUserIdAndIsActiveTrue(Long userId);

  // Spezifischer Split eines Users
  Optional<TrainingSplit> findByIdAndUserId(Long id, Long userId);

  // Cascades in the schema to workouts, exercises, sessions and their logs
  @Modifying
  @Query("DELETE FROM TrainingSplit s WHERE s.user.id = :userId")
  void deleteAllByUserId(@Param("userId") Long userId);
}
