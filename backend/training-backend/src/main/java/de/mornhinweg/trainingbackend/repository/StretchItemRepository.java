package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.StretchItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StretchItemRepository extends JpaRepository<StretchItem, Long> {

  Optional<StretchItem> findByIdAndRoutineUserId(Long id, Long userId);
}
