package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.ExerciseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseLogRepository extends JpaRepository<ExerciseLog, Long> {

  List<ExerciseLog> findByTrainingLogIdOrderByIdAsc(Long trainingLogId);

  List<ExerciseLog> findByExerciseIdOrderByCreatedAtDesc(Long exerciseId);

  @Query("""
      SELECT el FROM ExerciseLog el
      JOIN FETCH el.trainingLog tl
      JOIN FETCH el.exercise e
      JOIN FETCH e.workout
      WHERE e.libraryExercise.id = :libraryExerciseId
        AND el.completed = true
        AND tl.completedAt IS NOT NULL
      ORDER BY tl.completedAt ASC
      """)
  List<ExerciseLog> findCompletedByLibraryExerciseIdOrderByDate(@Param("libraryExerciseId") Long libraryExerciseId);

  @Query("""
      SELECT el FROM ExerciseLog el
      JOIN el.trainingLog tl
      WHERE el.exercise.libraryExercise.id = :libraryExerciseId
        AND el.completed = true
        AND tl.completedAt IS NOT NULL
        AND tl.id <> :excludeTrainingLogId
      ORDER BY tl.completedAt DESC
      LIMIT 1
      """)
  Optional<ExerciseLog> findPreviousCompleted(@Param("libraryExerciseId") Long libraryExerciseId,
                                              @Param("excludeTrainingLogId") Long excludeTrainingLogId);
}