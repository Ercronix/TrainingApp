package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import de.mornhinweg.trainingbackend.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/** Resolves the user behind a request; the starting point of every per-user ownership check. */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

  private final UserRepository userRepository;

  /** By id, not username: the username can change or be freed while a token is still valid. */
  public User get(Authentication authentication) {
    if (!(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
      throw new IllegalStateException("Unexpected principal: " + authentication.getPrincipal());
    }
    return userRepository.findById(principal.getId())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }
}
