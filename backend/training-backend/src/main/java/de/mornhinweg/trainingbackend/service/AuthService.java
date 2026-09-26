package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.AuthResponse;
import de.mornhinweg.trainingbackend.dto.LoginRequest;
import de.mornhinweg.trainingbackend.dto.RegisterRequest;
import de.mornhinweg.trainingbackend.dto.account.ChangePasswordRequest;
import de.mornhinweg.trainingbackend.dto.account.DeleteAccountRequest;
import de.mornhinweg.trainingbackend.dto.account.UpdateAccountRequest;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ConflictException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.TrainingSplitRepository;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import de.mornhinweg.trainingbackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final TrainingSplitRepository trainingSplitRepository;
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
    return userInfo(user);
  }

  /** Changes username and/or email. Access tokens identify the user by id, so they stay valid. */
  @Transactional
  public AuthResponse updateAccount(UpdateAccountRequest request, Authentication authentication) {
    User user = currentUser(authentication);
    verifyPassword(request.getCurrentPassword(), user);

    if (!user.getUsername().equals(request.getUsername())
        && userRepository.existsByUsername(request.getUsername())) {
      throw new ConflictException("Username is already taken");
    }
    if (!user.getEmail().equals(request.getEmail())
        && userRepository.existsByEmail(request.getEmail())) {
      throw new ConflictException("Email is already in use");
    }

    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    return userInfo(userRepository.save(user));
  }

  /** Signs out every other device and returns a fresh session for this one. */
  @Transactional
  public AuthResponse changePassword(ChangePasswordRequest request, Authentication authentication) {
    User user = currentUser(authentication);
    verifyPassword(request.getCurrentPassword(), user);

    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);
    refreshTokenService.revokeAll(user);
    return issueTokens(user);
  }

  /** Permanently deletes the user and, through the schema's cascades, everything they own. */
  @Transactional
  public void deleteAccount(DeleteAccountRequest request, Authentication authentication) {
    User user = currentUser(authentication);
    verifyPassword(request.getPassword(), user);
    // Splits first, see UserRepository.deleteUserById
    trainingSplitRepository.deleteAllByUserId(user.getId());
    userRepository.deleteUserById(user.getId());
  }

  private User currentUser(Authentication authentication) {
    return userRepository.findByUsername(authentication.getName())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }

  // A 400 rather than 401: the client treats 401 as an expired access token and refreshes
  private void verifyPassword(String rawPassword, User user) {
    if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
      throw new BadRequestException("Current password is incorrect");
    }
  }

  private static AuthResponse userInfo(User user) {
    return AuthResponse.builder()
        .type("Bearer")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .build();
  }

  private AuthResponse issueTokens(User user) {
    return AuthResponse.builder()
        .token(jwtUtil.generateToken(user.getId()))
        .refreshToken(refreshTokenService.issue(user))
        .type("Bearer")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .build();
  }
}
