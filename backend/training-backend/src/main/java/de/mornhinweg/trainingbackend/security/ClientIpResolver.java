package de.mornhinweg.trainingbackend.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * The client address used to key per-IP rate limits.
 *
 * <p>X-Forwarded-For is only believed when the request comes from a configured trusted proxy
 * ({@code auth.rate-limit.trusted-proxies}): then the entries are read from the right, skipping
 * trusted proxies, and the first other address is the client. Each proxy appends the address it
 * saw (Nginx's {@code $proxy_add_x_forwarded_for}), so that entry was written by a proxy we trust;
 * anything further left came from the client and is never used. Without a trusted proxy the
 * connection's own address is used.
 */
@Component
public class ClientIpResolver {

  private final List<IpAddressMatcher> trustedProxies;

  public ClientIpResolver(RateLimitProperties properties) {
    this.trustedProxies = properties.trustedProxies().stream()
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .map(IpAddressMatcher::new)
        .toList();
  }

  public String resolve(HttpServletRequest request) {
    String client = request.getRemoteAddr();
    if (!isTrusted(client)) {
      return client;
    }
    List<String> hops = forwardedFor(request);
    for (int i = hops.size() - 1; i >= 0; i--) {
      client = hops.get(i);
      if (!isTrusted(client)) {
        return client;
      }
    }
    // Only trusted addresses: the leftmost is the best we have
    return client;
  }

  private boolean isTrusted(String address) {
    for (IpAddressMatcher matcher : trustedProxies) {
      try {
        if (matcher.matches(address)) {
          return true;
        }
      } catch (IllegalArgumentException e) {
        // Not an IP address (e.g. "unknown"): never a trusted proxy
        return false;
      }
    }
    return false;
  }

  private static List<String> forwardedFor(HttpServletRequest request) {
    List<String> hops = new ArrayList<>();
    for (String header : Collections.list(request.getHeaders("X-Forwarded-For"))) {
      for (String hop : header.split(",")) {
        if (!hop.isBlank()) {
          hops.add(hop.trim());
        }
      }
    }
    return hops;
  }
}
