package de.mornhinweg.trainingbackend.security;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.Locale;

/**
 * The in-memory limiters guarding the public endpoints against brute force. The per-IP ones are
 * applied by {@link AuthRateLimitFilter}; the per-username login limit by AuthService, which
 * knows the username once the body is parsed and whether the password was right.
 */
@Component
public class AuthRateLimits {

  final RateLimiter loginPerIp;
  final RateLimiter registerPerIp;
  final RateLimiter refreshPerIp;
  final RateLimiter stretchReminderPerIp;
  private final RateLimiter loginPerUsername;

  // A Clock bean is only defined by tests, to move time forward
  public AuthRateLimits(RateLimitProperties properties, ObjectProvider<Clock> clockProvider) {
    Clock clock = clockProvider.getIfAvailable(Clock::systemUTC);
    int maxKeys = properties.maxKeys();
    this.loginPerIp = new RateLimiter(properties.loginPerIp(), maxKeys, clock);
    this.loginPerUsername = new RateLimiter(properties.loginPerUsername(), maxKeys, clock);
    this.registerPerIp = new RateLimiter(properties.registerPerIp(), maxKeys, clock);
    this.refreshPerIp = new RateLimiter(properties.refreshPerIp(), maxKeys, clock);
    this.stretchReminderPerIp = new RateLimiter(properties.stretchReminderPerIp(), maxKeys, clock);
  }

  /**
   * Counts a login attempt for the username, or throws TooManyRequestsException once it has had
   * too many since its last successful login, even if this attempt's password is right.
   */
  public void acquireLogin(String username) {
    loginPerUsername.acquire(usernameKey(username));
  }

  public void loginSucceeded(String username) {
    loginPerUsername.reset(usernameKey(username));
  }

  // Usernames are matched exactly at login; the limit still treats "Alice " and "alice" as one,
  // so varying case or spacing doesn't buy an attacker extra attempts
  private static String usernameKey(String username) {
    return username.strip().toLowerCase(Locale.ROOT);
  }
}
