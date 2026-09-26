package de.mornhinweg.trainingbackend.repository;

import de.mornhinweg.trainingbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByUsername(String username);

  Optional<User> findByEmail(String email);

  Boolean existsByUsername(String username);

  Boolean existsByEmail(String email);

  // Für OAuth2
  Optional<User> findByProviderAndProviderId(String provider, String providerId);

  // A bulk delete skips JPA cascades and lets the schema's ON DELETE CASCADE remove what the user
  // owns, instead of Hibernate loading and deleting the whole graph row by row. Delete the user's
  // splits first: exercises reference library_exercises without a cascade, so deleting the user
  // alone can remove a library entry while an exercise still points at it.
  @Modifying
  @Query("DELETE FROM User u WHERE u.id = :id")
  void deleteUserById(@Param("id") Long id);
}