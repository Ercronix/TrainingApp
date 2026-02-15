package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.TrainingSplit;
import org.springframework.data.jpa.repository.JpaRepository;
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
}