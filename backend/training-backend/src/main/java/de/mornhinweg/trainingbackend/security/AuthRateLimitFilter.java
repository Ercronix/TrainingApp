package de.mornhinweg.trainingbackend.security;

import de.mornhinweg.trainingbackend.exception.TooManyRequestsException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
import java.util.Map;

/**
 * Per-client-IP limits on the public endpoints (login, register, refresh and the stretch
 * reminder's "Done" link). Runs in the security filter chain after CORS (so a 429 still carries
 * CORS headers) and before authentication. Answers over-limit requests with GlobalExceptionHandler's
 * 429 JSON and a Retry-After header.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

  private final Map<RequestMatcher, RateLimiter> limits;
  private final ClientIpResolver clientIpResolver;
  private final HandlerExceptionResolver exceptionResolver;

  public AuthRateLimitFilter(AuthRateLimits rateLimits,
                             ClientIpResolver clientIpResolver,
                             @Qualifier("handlerExceptionResolver") HandlerExceptionResolver exceptionResolver) {
    PathPatternRequestMatcher.Builder paths = PathPatternRequestMatcher.withDefaults();
    this.limits = Map.of(
        paths.matcher(HttpMethod.POST, "/api/auth/login"), rateLimits.loginPerIp,
        paths.matcher(HttpMethod.POST, "/api/auth/register"), rateLimits.registerPerIp,
        paths.matcher(HttpMethod.POST, "/api/auth/refresh"), rateLimits.refreshPerIp,
        paths.matcher(HttpMethod.POST, "/api/stretch/reminder/done/*"), rateLimits.stretchReminderPerIp
    );
    this.clientIpResolver = clientIpResolver;
    this.exceptionResolver = exceptionResolver;
  }

  @Override
  protected void doFilterInternal(@NonNull HttpServletRequest request,
                                  @NonNull HttpServletResponse response,
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {
    for (Map.Entry<RequestMatcher, RateLimiter> limit : limits.entrySet()) {
      if (limit.getKey().matches(request)) {
        try {
          limit.getValue().acquire(clientIpResolver.resolve(request));
        } catch (TooManyRequestsException e) {
          if (exceptionResolver.resolveException(request, response, null, e) == null) {
            response.setHeader("Retry-After", String.valueOf(e.getRetryAfterSeconds()));
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value(), e.getMessage());
          }
          return;
        }
        break;
      }
    }
    filterChain.doFilter(request, response);
  }
}
