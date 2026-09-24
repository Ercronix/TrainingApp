package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

  List<Exercise> findByWorkoutIdOrderByOrderIndexAsc(Long workoutId);

  List<Exercise> findByWorkoutIdAndTemporaryFalseOrderByOrderIndexAsc(Long workoutId);

  long countByWorkoutIdAndTemporaryFalse(Long workoutId);

  long countByLibraryExerciseId(Long libraryExerciseId);

  /**
   * Per library entry of the user: [libraryExerciseId, number of workout (non-temporary)
   * exercises using it, latest lastTrainedAt across all its exercises].
   */
  @Query("""
      SELECT e.libraryExercise.id,
             SUM(CASE WHEN e.temporary = false THEN 1 ELSE 0 END),
             MAX(e.lastTrainedAt)
      FROM Exercise e
      WHERE e.libraryExercise.user.id = :userId
      GROUP BY e.libraryExercise.id
      """)
  List<Object[]> findUsageByUserId(@Param("userId") Long userId);

  /** Same as {@link #findUsageByUserId} for a single library entry (empty when unused). */
  @Query("""
      SELECT e.libraryExercise.id,
             SUM(CASE WHEN e.temporary = false THEN 1 ELSE 0 END),
             MAX(e.lastTrainedAt)
      FROM Exercise e
      WHERE e.libraryExercise.id = :libraryExerciseId
      GROUP BY e.libraryExercise.id
      """)
  List<Object[]> findUsageByLibraryExerciseId(@Param("libraryExerciseId") Long libraryExerciseId);
}
