package de.mornhinweg.trainingbackend.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * Limits for the public auth endpoints ({@code auth.rate-limit.*}; defaults in
 * application.properties). Each limit allows {@code limit} requests per fixed {@code window}.
 *
 * @param maxKeys         how many IPs/usernames each limiter tracks at most, so memory stays
 *                        bounded however many distinct keys an attacker sends
 * @param trustedProxies  IPs or CIDR ranges of reverse proxies whose X-Forwarded-For entries are
 *                        believed (see {@link ClientIpResolver}); empty trusts none
 */
@ConfigurationProperties("auth.rate-limit")
public record RateLimitProperties(
    Limit loginPerIp,
    Limit loginPerUsername,
    Limit registerPerIp,
    Limit refreshPerIp,
    Limit stretchReminderPerIp,
    int maxKeys,
    List<String> trustedProxies
) {

  public RateLimitProperties {
    trustedProxies = trustedProxies == null ? List.of() : trustedProxies;
  }

  public record Limit(int limit, Duration window) {
  }
}
