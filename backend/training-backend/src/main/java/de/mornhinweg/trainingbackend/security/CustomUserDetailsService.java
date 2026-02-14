package de.mornhinweg.trainingbackend.security;

import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

    // Spring Security UserDetails erstellen
    return new org.springframework.security.core.userdetails.User(
        user.getUsername(),
        user.getPassword(),
        new ArrayList<>()  // Authorities/Roles
    );
  }
}