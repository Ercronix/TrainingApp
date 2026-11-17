package de.mornhinweg.trainingbackend.security;

import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    return toUserDetails(user);
  }

  public UserDetails loadUserById(Long id) throws UsernameNotFoundException {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
    return toUserDetails(user);
  }

  private static UserDetails toUserDetails(User user) {
    return new AuthenticatedUser(user);
  }
}