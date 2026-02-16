package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.Workout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkoutRepository extends JpaRepository<Workout, Long> {

  List<Workout> findBySplitIdOrderByOrderIndexAsc(Long splitId);
}