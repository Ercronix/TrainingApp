package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.LibraryExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LibraryExerciseRepository extends JpaRepository<LibraryExercise, Long> {

  @Query("SELECT le FROM LibraryExercise le WHERE le.user.id = :userId ORDER BY LOWER(le.name) ASC")
  List<LibraryExercise> findByUserIdOrderByName(@Param("userId") Long userId);

  Optional<LibraryExercise> findByIdAndUserId(Long id, Long userId);

  Optional<LibraryExercise> findByUserIdAndNameIgnoreCase(Long userId, String name);
}
