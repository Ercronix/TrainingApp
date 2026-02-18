package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.ExerciseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseLogRepository extends JpaRepository<ExerciseLog, Long> {

  List<ExerciseLog> findByTrainingLogIdOrderByIdAsc(Long trainingLogId);

  List<ExerciseLog> findByExerciseIdOrderByCreatedAtDesc(Long exerciseId);
}