package de.mornhinweg.trainingbackend.security;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtUtil jwtUtil;
  private final CustomUserDetailsService userDetailsService;

  @Override
  protected void doFilterInternal(HttpServletRequest request,
                                  @NonNull HttpServletResponse response,
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {

    // 1. Authorization Header holen
    final String authorizationHeader = request.getHeader("Authorization");

    Long userId = null;
    String jwt = null;

    // 2. Token aus Header extrahieren
    if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
      jwt = authorizationHeader.substring(7);  // "Bearer " entfernen
      try {
        userId = jwtUtil.extractUserId(jwt);
      } catch (ExpiredJwtException e) {
        // Expected once access tokens age out; the client refreshes on the resulting 401
        logger.debug("JWT expired");
      } catch (NumberFormatException e) {
        // Issued before tokens carried the user id; also answered with a 401 the client refreshes on
        logger.debug("JWT without a user id subject");
      } catch (Exception e) {
        logger.error("Error extracting user id from JWT", e);
      }
    }

    // 3. Token validieren und Authentication setzen
    if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      try {
        // Loaded fresh, so the principal's name is the current username even right after a rename
        UserDetails userDetails = this.userDetailsService.loadUserById(userId);
        UsernamePasswordAuthenticationToken authenticationToken =
            new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
            );
        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
      } catch (UsernameNotFoundException e) {
        // The account was deleted after the token was issued; the request stays unauthenticated (401)
        logger.debug("JWT for a user that no longer exists");
      }
    }

    filterChain.doFilter(request, response);
  }
}