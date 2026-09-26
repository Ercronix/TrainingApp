package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  void deleteByTokenHash(String tokenHash);

  @Modifying
  @Query("DELETE FROM RefreshToken rt WHERE rt.user.id = :userId AND rt.expiresAt < :now")
  void deleteExpiredForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);

  @Modifying
  @Query("DELETE FROM RefreshToken rt WHERE rt.user.id = :userId")
  void deleteAllForUser(@Param("userId") Long userId);
}
