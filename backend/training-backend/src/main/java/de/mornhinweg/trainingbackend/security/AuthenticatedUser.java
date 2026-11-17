package de.mornhinweg.trainingbackend.security;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import org.springframework.security.core.userdetails.User;

import java.util.List;

/**
 * The principal of an authenticated request. Carries the user id (the stable identity, see
 * {@link JwtAuthenticationFilter}) next to the username, so services never look a user up by name.
 */
@Getter
@EqualsAndHashCode(callSuper = true)
public class AuthenticatedUser extends User {

  private final Long id;

  public AuthenticatedUser(de.mornhinweg.trainingbackend.model.User user) {
    super(user.getUsername(), user.getPassword(), List.of());
    this.id = user.getId();
  }
}
