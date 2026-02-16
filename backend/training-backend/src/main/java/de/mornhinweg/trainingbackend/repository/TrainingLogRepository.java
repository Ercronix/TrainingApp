package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.TrainingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}