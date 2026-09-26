package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AccountControllerTest {

  private static final String PASSWORD = "password123";
  private static final String NEW_PASSWORD = "newpassword456";

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private JdbcTemplate jdbc;

  @Value("${jwt.secret}")
  private String jwtSecret;

  private record Session(String username, String email, long userId, String token, String refreshToken) {}

  @Test
  void updateAccountChangesUsernameAndEmailWithoutEndingTheSession() throws Exception {
    Session s = register();
    String newName = uniqueName();

    perform(put("/api/account"), s.token(), accountBody(newName, newName + "@example.com", PASSWORD))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(newName))
        .andExpect(jsonPath("$.email").value(newName + "@example.com"));

    // Tokens identify the user by id, so the same access token keeps working after a rename
    perform(get("/api/auth/me"), s.token(), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(newName));

    login(newName, PASSWORD).andExpect(status().isOk());
    login(s.username(), PASSWORD).andExpect(status().isUnauthorized());
  }

  @Test
  void aRenamedAwayUsernameTakenBySomeoneElseStillResolvesToTheOriginalUser() throws Exception {
    Session original = register();
    perform(put("/api/account"), original.token(), accountBody(uniqueName(), original.email(), PASSWORD))
        .andExpect(status().isOk());

    Session newcomer = register(original.username());

    perform(get("/api/auth/me"), original.token(), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").value(original.userId()));
    perform(get("/api/auth/me"), newcomer.token(), null)
        .andExpect(jsonPath("$.userId").value(newcomer.userId()));
  }

  @Test
  void updateAccountRejectsAUsernameOrEmailTakenBySomeoneElse() throws Exception {
    Session me = register();
    Session other = register();

    perform(put("/api/account"), me.token(), accountBody(other.username(), me.email(), PASSWORD))
        .andExpect(status().isConflict());
    perform(put("/api/account"), me.token(), accountBody(me.username(), other.email(), PASSWORD))
        .andExpect(status().isConflict());

    // Resubmitting your own username and email is not a conflict
    perform(put("/api/account"), me.token(), accountBody(me.username(), me.email(), PASSWORD))
        .andExpect(status().isOk());
  }

  @Test
  void accountChangesRequireTheCurrentPassword() throws Exception {
    Session s = register();

    // 400, not 401: the client treats a 401 as an expired access token
    perform(put("/api/account"), s.token(), accountBody(uniqueName(), "x@example.com", "wrong-password"))
        .andExpect(status().isBadRequest());
    perform(put("/api/account/password"), s.token(), passwordBody("wrong-password", NEW_PASSWORD))
        .andExpect(status().isBadRequest());
    perform(delete("/api/account"), s.token(), deleteBody("wrong-password"))
        .andExpect(status().isBadRequest());

    perform(get("/api/auth/me"), s.token(), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value(s.username()));
    login(s.username(), PASSWORD).andExpect(status().isOk());
  }

  @Test
  void invalidInputIsRejected() throws Exception {
    Session s = register();

    perform(put("/api/account/password"), s.token(), passwordBody(PASSWORD, "123"))
        .andExpect(status().isBadRequest());
    perform(put("/api/account"), s.token(), accountBody(s.username(), "not-an-email", PASSWORD))
        .andExpect(status().isBadRequest());
    perform(put("/api/account"), s.token(), accountBody("ab", s.email(), PASSWORD))
        .andExpect(status().isBadRequest());
  }

  @Test
  void changePasswordSignsOutEveryOtherSession() throws Exception {
    Session s = register();
    String otherDevice = JsonPath.read(content(login(s.username(), PASSWORD)), "$.refreshToken");

    String response = content(perform(put("/api/account/password"), s.token(), passwordBody(PASSWORD, NEW_PASSWORD))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty())
        .andExpect(jsonPath("$.refreshToken").isNotEmpty()));

    refresh(s.refreshToken()).andExpect(status().isUnauthorized());
    refresh(otherDevice).andExpect(status().isUnauthorized());
    refresh(JsonPath.read(response, "$.refreshToken")).andExpect(status().isOk());

    login(s.username(), PASSWORD).andExpect(status().isUnauthorized());
    login(s.username(), NEW_PASSWORD).andExpect(status().isOk());
  }

  @Test
  void deleteAccountRemovesTheUserAndEverythingTheyOwn() throws Exception {
    Session s = register();
    // Every table below users: split → workout → exercise (+ library entry) → session → log → sets
    long splitId = id(perform(post("/api/splits"), s.token(), "{\"name\":\"Split\"}"));
    long workoutId = id(perform(post("/api/workouts/split/" + splitId), s.token(), "{\"name\":\"Push\"}"));
    perform(post("/api/workouts/" + workoutId + "/exercises"), s.token(), "{\"name\":\"Bench Press\",\"sets\":3,\"reps\":8}")
        .andExpect(status().isCreated());
    long sessionId = id(perform(post("/api/training-logs/start"), s.token(), "{\"workoutId\":" + workoutId + "}"));
    String session = content(perform(get("/api/training-logs/" + sessionId), s.token(), null));
    long logId = ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();
    perform(put("/api/training-logs/exercise-logs/" + logId), s.token(), "{\"sets\":[{\"reps\":8,\"weight\":60}]}")
        .andExpect(status().isOk());

    perform(delete("/api/account"), s.token(), deleteBody(PASSWORD)).andExpect(status().isNoContent());

    perform(get("/api/auth/me"), s.token(), null).andExpect(status().isUnauthorized());
    refresh(s.refreshToken()).andExpect(status().isUnauthorized());
    login(s.username(), PASSWORD).andExpect(status().isUnauthorized());

    assertThat(count("SELECT count(*) FROM users WHERE id = ?", s.userId())).isZero();
    assertThat(count("SELECT count(*) FROM library_exercises WHERE user_id = ?", s.userId())).isZero();
    assertThat(count("SELECT count(*) FROM workouts WHERE id = ?", workoutId)).isZero();
    assertThat(count("SELECT count(*) FROM training_logs WHERE id = ?", sessionId)).isZero();
    assertThat(count("SELECT count(*) FROM set_logs WHERE exercise_log_id = ?", logId)).isZero();
  }

  @Test
  void aDeletedAccountsTokenCannotReachAnAccountThatReusesItsUsername() throws Exception {
    Session deleted = register();
    perform(delete("/api/account"), deleted.token(), deleteBody(PASSWORD)).andExpect(status().isNoContent());

    register(deleted.username());

    perform(get("/api/auth/me"), deleted.token(), null).andExpect(status().isUnauthorized());
  }

  @Test
  void tokensIssuedWithAUsernameSubjectAreRejected() throws Exception {
    // Access tokens minted before the subject became the user id; the client refreshes on the 401
    Session s = register();
    String legacy = Jwts.builder()
        .subject(s.username())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + 60_000))
        .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
        .compact();

    perform(get("/api/auth/me"), legacy, null).andExpect(status().isUnauthorized());
  }

  private Session register() throws Exception {
    return register(uniqueName());
  }

  private Session register(String username) throws Exception {
    String email = UUID.randomUUID() + "@example.com";
    String body = """
        {"username":"%s","email":"%s","password":"%s"}
        """.formatted(username, email, PASSWORD);
    String response = content(mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated()));
    return new Session(
        username,
        email,
        ((Number) JsonPath.read(response, "$.userId")).longValue(),
        JsonPath.read(response, "$.token"),
        JsonPath.read(response, "$.refreshToken"));
  }

  private ResultActions login(String username, String password) throws Exception {
    return mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
        .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password)));
  }

  private ResultActions refresh(String refreshToken) throws Exception {
    return mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
        .content("{\"refreshToken\":\"" + refreshToken + "\"}"));
  }

  private ResultActions perform(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
    request.header("Authorization", "Bearer " + token);
    if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
    return mockMvc.perform(request);
  }

  private long count(String sql, long id) {
    return jdbc.queryForObject(sql, Long.class, id);
  }

  private static String accountBody(String username, String email, String currentPassword) {
    return "{\"username\":\"%s\",\"email\":\"%s\",\"currentPassword\":\"%s\"}".formatted(username, email, currentPassword);
  }

  private static String passwordBody(String currentPassword, String newPassword) {
    return "{\"currentPassword\":\"%s\",\"newPassword\":\"%s\"}".formatted(currentPassword, newPassword);
  }

  private static String deleteBody(String password) {
    return "{\"password\":\"" + password + "\"}";
  }

  private static String uniqueName() {
    return "test_" + UUID.randomUUID().toString().substring(0, 8);
  }

  private static String content(ResultActions result) throws Exception {
    return result.andReturn().getResponse().getContentAsString();
  }

  private static long id(ResultActions result) throws Exception {
    return ((Number) JsonPath.read(content(result), "$.id")).longValue();
  }
}
