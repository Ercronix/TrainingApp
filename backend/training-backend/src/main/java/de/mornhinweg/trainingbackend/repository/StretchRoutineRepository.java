package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.StretchRoutine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StretchRoutineRepository extends JpaRepository<StretchRoutine, Long> {

  Optional<StretchRoutine> findByUserId(Long userId);

  // With its items loaded, for use outside a transaction (the reminder job)
  @Query("SELECT DISTINCT r FROM StretchRoutine r LEFT JOIN FETCH r.items WHERE r.user.id = :userId")
  Optional<StretchRoutine> findWithItemsByUserId(@Param("userId") Long userId);
}
