package de.mornhinweg.trainingbackend.security;

import de.mornhinweg.trainingbackend.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The limits on the public endpoints, with small limits and a clock the tests move forward. The
 * limiters keep their state for the whole class, so every test uses its own client IPs and users.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "auth.rate-limit.login-per-ip.limit=6",
    "auth.rate-limit.login-per-ip.window=1m",
    "auth.rate-limit.login-per-username.limit=3",
    "auth.rate-limit.login-per-username.window=15m",
    "auth.rate-limit.register-per-ip.limit=2",
    "auth.rate-limit.register-per-ip.window=1h",
    "auth.rate-limit.refresh-per-ip.limit=2",
    "auth.rate-limit.refresh-per-ip.window=1m",
    "auth.rate-limit.stretch-reminder-per-ip.limit=2",
    "auth.rate-limit.stretch-reminder-per-ip.window=1m",
    "auth.rate-limit.trusted-proxies=10.0.0.0/8",
})
class AuthRateLimitTest {

  private static final String PASSWORD = "password123";
  private static final AtomicInteger NEXT_IP = new AtomicInteger(1);

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private MutableClock clock;

  @TestConfiguration
  static class ClockConfig {
    @Bean
    MutableClock clock() {
      return new MutableClock();
    }
  }

  @Test
  void usernameIsLockedAfterFailedLoginsEvenWithTheRightPassword() throws Exception {
    String username = register(nextIp());
    String ip = nextIp();

    for (int i = 0; i < 3; i++) {
      login(username, "wrong-password", ip).andExpect(status().isUnauthorized());
    }

    String retryAfter = login(username, PASSWORD, ip)
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.status").value(429))
        .andExpect(jsonPath("$.error").value("Too Many Requests"))
        .andExpect(jsonPath("$.message").value(startsWith("Too many attempts, try again in")))
        .andExpect(jsonPath("$.timestamp").isNotEmpty())
        .andReturn().getResponse().getHeader("Retry-After");
    assertThat(Long.parseLong(retryAfter)).isBetween(1L, 15 * 60L);

    // Another IP, case or spacing doesn't help
    login("  " + username.toUpperCase() + " ", PASSWORD, nextIp()).andExpect(status().isTooManyRequests());
  }

  @Test
  void successfulLoginResetsTheUsernameCount() throws Exception {
    String username = register(nextIp());
    String ip = nextIp();

    login(username, "wrong-password", ip).andExpect(status().isUnauthorized());
    login(username, "wrong-password", ip).andExpect(status().isUnauthorized());
    login(username, PASSWORD, ip).andExpect(status().isOk());
    login(username, "wrong-password", ip).andExpect(status().isUnauthorized());
    login(username, "wrong-password", ip).andExpect(status().isUnauthorized());
    login(username, PASSWORD, ip).andExpect(status().isOk());
  }

  @Test
  void otherUsernamesFromTheSameIpWorkUntilTheIpLimit() throws Exception {
    String registerIp = nextIp();
    String locked = register(registerIp);
    String other = register(registerIp);
    String ip = nextIp();

    for (int i = 0; i < 3; i++) {
      login(locked, "wrong-password", ip).andExpect(status().isUnauthorized());
    }
    login(locked, PASSWORD, ip).andExpect(status().isTooManyRequests());

    // Requests 5 and 6 from this IP
    login(other, PASSWORD, ip).andExpect(status().isOk());
    login(other, PASSWORD, ip).andExpect(status().isOk());
    // The IP has used up its 6 login requests per minute
    login(other, PASSWORD, ip)
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.status").value(429));

    login(other, PASSWORD, nextIp()).andExpect(status().isOk());
  }

  @Test
  void registrationIsLimitedPerIp() throws Exception {
    String ip = nextIp();
    register(ip);
    register(ip);

    String retryAfter = registerRequest(ip)
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.message").value(startsWith("Too many attempts, try again in")))
        .andReturn().getResponse().getHeader("Retry-After");
    assertThat(Long.parseLong(retryAfter)).isBetween(1L, 3600L);

    register(nextIp());
  }

  @Test
  void spoofedForwardedForFromAClientIsIgnored() throws Exception {
    // Not a trusted proxy, so its X-Forwarded-For is ignored and its own address counts
    String client = "198.51.100.77";
    for (int i = 0; i < 2; i++) {
      registerRequest(client, "203.0.113." + i).andExpect(status().isCreated());
    }
    registerRequest(client, "203.0.113.50").andExpect(status().isTooManyRequests());
  }

  @Test
  void behindATrustedProxyTheAddressItSawCounts() throws Exception {
    String client = nextIp();
    String proxy = "10.0.0.5";
    // The client's own leftmost entries change every time; Nginx appended the real address
    registerRequest(proxy, "1.1.1.1, " + client).andExpect(status().isCreated());
    registerRequest(proxy, "2.2.2.2, " + client).andExpect(status().isCreated());
    registerRequest(proxy, "3.3.3.3, " + client).andExpect(status().isTooManyRequests());
    // Also through two trusted proxies, and with the spoofed entry claiming a trusted address
    registerRequest(proxy, "10.9.9.9, " + client + ", 10.0.0.9").andExpect(status().isTooManyRequests());

    // Other clients behind the same proxy are counted on their own
    registerRequest(proxy, "1.1.1.1, " + nextIp()).andExpect(status().isCreated());
  }

  @Test
  void limitsResetAfterTheirWindow() throws Exception {
    String ip = nextIp();
    String username = register(ip);
    register(ip);
    registerRequest(ip).andExpect(status().isTooManyRequests());

    String loginIp = nextIp();
    for (int i = 0; i < 3; i++) {
      login(username, "wrong-password", loginIp).andExpect(status().isUnauthorized());
    }
    login(username, PASSWORD, loginIp).andExpect(status().isTooManyRequests());

    clock.advance(Duration.ofMinutes(15));
    login(username, PASSWORD, loginIp).andExpect(status().isOk());

    clock.advance(Duration.ofMinutes(45));
    register(ip);
  }

  @Test
  void refreshAndStretchReminderAreLimitedPerIp() throws Exception {
    String ip = nextIp();
    String body = "{\"refreshToken\":\"not-a-token\"}";
    for (int i = 0; i < 2; i++) {
      mockMvc.perform(withIp(post("/api/auth/refresh"), ip).contentType(MediaType.APPLICATION_JSON).content(body))
          .andExpect(status().isUnauthorized());
    }
    // Answered after CORS, so a browser on another origin can read the 429
    mockMvc.perform(withIp(post("/api/auth/refresh"), ip).contentType(MediaType.APPLICATION_JSON).content(body)
            .with(r -> {
              r.setServerName("backend");
              return r;
            })
            .header("Origin", "http://localhost"))
        .andExpect(status().isTooManyRequests())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost"));

    for (int i = 0; i < 2; i++) {
      int code = mockMvc.perform(withIp(post("/api/stretch/reminder/done/unknown-token"), ip))
          .andReturn().getResponse().getStatus();
      assertThat(code).isNotEqualTo(429);
    }
    mockMvc.perform(withIp(post("/api/stretch/reminder/done/unknown-token"), ip))
        .andExpect(status().isTooManyRequests());
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private static String nextIp() {
    int n = NEXT_IP.getAndIncrement();
    return "198.18." + (n / 250) + "." + (n % 250 + 1);
  }

  private static MockHttpServletRequestBuilder withIp(MockHttpServletRequestBuilder request, String ip) {
    return request.with(r -> {
      r.setRemoteAddr(ip);
      return r;
    });
  }

  private ResultActions login(String username, String password, String ip) throws Exception {
    String body = "{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password);
    return mockMvc.perform(withIp(post("/api/auth/login"), ip)
        .contentType(MediaType.APPLICATION_JSON).content(body));
  }

  private String register(String ip) throws Exception {
    String name = newUsername();
    registerRequest(ip, null, name).andExpect(status().isCreated());
    return name;
  }

  private ResultActions registerRequest(String ip) throws Exception {
    return registerRequest(ip, null);
  }

  private ResultActions registerRequest(String ip, String forwardedFor) throws Exception {
    return registerRequest(ip, forwardedFor, newUsername());
  }

  private static String newUsername() {
    return "rl_" + UUID.randomUUID().toString().substring(0, 8);
  }

  private ResultActions registerRequest(String ip, String forwardedFor, String name) throws Exception {
    String body = """
        {"username":"%s","email":"%s@example.com","password":"%s"}
        """.formatted(name, name, PASSWORD);
    MockHttpServletRequestBuilder request = withIp(post("/api/auth/register"), ip)
        .contentType(MediaType.APPLICATION_JSON).content(body);
    if (forwardedFor != null) {
      request.header("X-Forwarded-For", forwardedFor);
    }
    return mockMvc.perform(request);
  }

  static class MutableClock extends Clock {
    private volatile Instant now = Instant.now();

    void advance(Duration duration) {
      now = now.plus(duration);
    }

    @Override
    public ZoneId getZone() {
      return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
      throw new UnsupportedOperationException();
    }

    @Override
    public Instant instant() {
      return now;
    }
  }
}
