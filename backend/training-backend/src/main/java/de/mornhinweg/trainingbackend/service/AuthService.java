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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final AuthenticationManager authenticationManager;

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

    UserDetails userDetails = new org.springframework.security.core.userdetails.User(
        savedUser.getUsername(),
        savedUser.getPassword(),
        new ArrayList<>()
    );
    String token = jwtUtil.generateToken(userDetails);

    return AuthResponse.builder()
        .token(token)
        .type("Bearer")
        .userId(savedUser.getId())
        .username(savedUser.getUsername())
        .email(savedUser.getEmail())
        .build();
  }

  public AuthResponse login(LoginRequest request) {
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.getUsername(),
            request.getPassword()
        )
    );

    User user = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    UserDetails userDetails = (UserDetails) authentication.getPrincipal();
    String token = jwtUtil.generateToken(userDetails);

    return AuthResponse.builder()
        .token(token)
        .type("Bearer")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .build();
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
}