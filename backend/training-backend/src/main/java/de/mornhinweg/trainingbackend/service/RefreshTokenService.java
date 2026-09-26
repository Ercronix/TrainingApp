package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.exception.InvalidTokenException;
import de.mornhinweg.trainingbackend.model.RefreshToken;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

  private static final SecureRandom RANDOM = new SecureRandom();

  private final RefreshTokenRepository refreshTokenRepository;

  @Value("${jwt.refresh-expiration-days:60}")
  private long refreshExpirationDays;

  /** Creates a new refresh token for the user and returns the raw token (only the hash is stored). */
  @Transactional
  public String issue(User user) {
    refreshTokenRepository.deleteExpiredForUser(user.getId(), LocalDateTime.now());

    byte[] bytes = new byte[32];
    RANDOM.nextBytes(bytes);
    String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

    refreshTokenRepository.save(RefreshToken.builder()
        .user(user)
        .tokenHash(hash(rawToken))
        .expiresAt(LocalDateTime.now().plusDays(refreshExpirationDays))
        .build());

    return rawToken;
  }

  /** Consumes a refresh token (single use) and returns the user it belonged to. */
  @Transactional(noRollbackFor = InvalidTokenException.class)
  public User consume(String rawToken) {
    RefreshToken token = refreshTokenRepository.findByTokenHash(hash(rawToken))
        .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

    refreshTokenRepository.delete(token);

    if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new InvalidTokenException("Refresh token expired");
    }
    return token.getUser();
  }

  @Transactional
  public void revoke(String rawToken) {
    refreshTokenRepository.deleteByTokenHash(hash(rawToken));
  }

  /** Signs the user out on every device. */
  @Transactional
  public void revokeAll(User user) {
    refreshTokenRepository.deleteAllForUser(user.getId());
  }

  private static String hash(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
