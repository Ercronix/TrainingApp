package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.ExerciseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseLogRepository extends JpaRepository<ExerciseLog, Long> {

  List<ExerciseLog> findByTrainingLogIdOrderByIdAsc(Long trainingLogId);

  List<ExerciseLog> findByExerciseIdOrderByCreatedAtDesc(Long exerciseId);

  @Query("""
      SELECT el FROM ExerciseLog el
      JOIN FETCH el.trainingLog tl
      WHERE el.exercise.id = :exerciseId
        AND el.completed = true
        AND tl.completedAt IS NOT NULL
      ORDER BY tl.completedAt ASC
      """)
  List<ExerciseLog> findCompletedByExerciseIdOrderByDate(@Param("exerciseId") Long exerciseId);
}