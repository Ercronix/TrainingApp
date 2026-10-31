package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.StretchRoutine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StretchRoutineRepository extends JpaRepository<StretchRoutine, Long> {

  Optional<StretchRoutine> findByUserId(Long userId);
}
