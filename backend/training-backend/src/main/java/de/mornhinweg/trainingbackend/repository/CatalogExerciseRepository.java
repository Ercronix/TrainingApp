package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.CatalogExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogExerciseRepository extends JpaRepository<CatalogExercise, Long> {

  @Query("SELECT c FROM CatalogExercise c ORDER BY LOWER(c.name) ASC")
  List<CatalogExercise> findAllOrderByName();
}
