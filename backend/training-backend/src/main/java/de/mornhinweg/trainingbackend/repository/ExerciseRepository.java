package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

  List<Exercise> findByWorkoutIdOrderByOrderIndexAsc(Long workoutId);
}