package de.mornhinweg.trainingbackend.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import de.mornhinweg.trainingbackend.exception.TooManyRequestsException;

import java.time.Clock;
import java.time.Duration;

/**
 * In-memory fixed-window counter: at most {@code limit} acquisitions per key per {@code window}.
 * Fine for the single backend instance. Keys live in a size-bounded Caffeine cache that also
 * drops them once their window has passed; the window itself is measured with {@code clock}.
 */
class RateLimiter {

  // Real usernames are at most 50 characters and IPs shorter still; longer keys are cut so a
  // huge value can't blow up memory
  private static final int MAX_KEY_LENGTH = 64;

  private final int limit;
  private final Duration window;
  private final Clock clock;
  private final Cache<String, Window> windows;

  RateLimiter(RateLimitProperties.Limit config, int maxKeys, Clock clock) {
    this.limit = config.limit();
    this.window = config.window();
    this.clock = clock;
    this.windows = Caffeine.newBuilder()
        .maximumSize(maxKeys)
        .expireAfterWrite(window)
        .build();
  }

  /** Counts one request for {@code key}, or throws if the key has used up its window. */
  void acquire(String key) {
    long now = clock.millis();
    long[] retryAfterMillis = {0};
    windows.asMap().compute(truncate(key), (k, current) -> {
      if (current == null || now >= current.start + window.toMillis()) {
        return new Window(now, 1);
      }
      if (current.count < limit) {
        return new Window(current.start, current.count + 1);
      }
      retryAfterMillis[0] = current.start + window.toMillis() - now;
      return current;
    });
    if (retryAfterMillis[0] > 0) {
      throw new TooManyRequestsException(Duration.ofMillis(retryAfterMillis[0]));
    }
  }

  /** Forgets the key's count, e.g. after a successful login. */
  void reset(String key) {
    windows.invalidate(truncate(key));
  }

  private static String truncate(String key) {
    return key.length() > MAX_KEY_LENGTH ? key.substring(0, MAX_KEY_LENGTH) : key;
  }

  private record Window(long start, int count) {
  }
}
