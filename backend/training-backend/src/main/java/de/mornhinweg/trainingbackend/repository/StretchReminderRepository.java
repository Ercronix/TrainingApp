package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.StretchReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StretchReminderRepository extends JpaRepository<StretchReminder, Long> {

  Optional<StretchReminder> findByUserId(Long userId);

  Optional<StretchReminder> findByDoneToken(String doneToken);

  @Query("SELECT r FROM StretchReminder r JOIN FETCH r.user WHERE r.enabled = true")
  List<StretchReminder> findAllEnabled();
}
