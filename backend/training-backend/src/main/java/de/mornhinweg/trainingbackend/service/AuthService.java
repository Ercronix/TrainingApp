package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.AuthResponse;
import de.mornhinweg.trainingbackend.dto.LoginRequest;
import de.mornhinweg.trainingbackend.dto.RegisterRequest;
import de.mornhinweg.trainingbackend.exception.ConflictException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import de.mornhinweg.trainingbackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final AuthenticationManager authenticationManager;
  private final RefreshTokenService refreshTokenService;

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new ConflictException("Username is already taken");
    }

    if (userRepository.existsByEmail(request.getEmail())) {
      throw new ConflictException("Email is already in use");
    }

    User user = User.builder()
        .username(request.getUsername())
        .email(request.getEmail())
        .password(passwordEncoder.encode(request.getPassword()))
        .build();

    User savedUser = userRepository.save(user);
    return issueTokens(savedUser);
  }

  public AuthResponse login(LoginRequest request) {
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.getUsername(),
            request.getPassword()
        )
    );

    User user = userRepository.findByUsername(authentication.getName())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    return issueTokens(user);
  }

  /** Exchanges a refresh token for a new access token + rotated refresh token. */
  public AuthResponse refresh(String refreshToken) {
    return issueTokens(refreshTokenService.consume(refreshToken));
  }

  public void logout(String refreshToken) {
    refreshTokenService.revoke(refreshToken);
  }

  public AuthResponse getMe(String username) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    return AuthResponse.builder()
        .type("Bearer")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .build();
  }

  private AuthResponse issueTokens(User user) {
    return AuthResponse.builder()
        .token(jwtUtil.generateToken(user.getUsername()))
        .refreshToken(refreshTokenService.issue(user))
        .type("Bearer")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .build();
  }
}
