package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import de.mornhinweg.trainingbackend.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The Docker healthcheck calls the health endpoints without a token. They must answer with the
 * bare status only, and no other actuator endpoint may be reachable, with or without a token.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class ActuatorHealthTest {

  @Autowired
  private MockMvc mockMvc;

  @ParameterizedTest
  @ValueSource(strings = {"/actuator/health/liveness", "/actuator/health/readiness"})
  void probesAreUpWithoutTokenAndShowOnlyTheStatus(String path) throws Exception {
    mockMvc.perform(get(path))
        .andExpect(status().isOk())
        .andExpect(content().json("{\"status\":\"UP\"}", true));
  }

  // The root response also names the probe groups (Boot always lists them), but no components or details
  private static final String ROOT_HEALTH = "{\"status\":\"UP\",\"groups\":[\"liveness\",\"readiness\"]}";

  @Test
  void healthIsUpWithoutTokenAndShowsNoDetails() throws Exception {
    mockMvc.perform(get("/actuator/health"))
        .andExpect(status().isOk())
        .andExpect(content().json(ROOT_HEALTH, true));
  }

  @Test
  void healthShowsNoDetailsEvenWithToken() throws Exception {
    mockMvc.perform(get("/actuator/health").header("Authorization", "Bearer " + accessToken()))
        .andExpect(status().isOk())
        .andExpect(content().json(ROOT_HEALTH, true));
  }

  @ParameterizedTest
  @ValueSource(strings = {"/actuator", "/actuator/env", "/actuator/beans", "/actuator/info",
      "/actuator/configprops", "/actuator/mappings", "/actuator/metrics", "/actuator/loggers",
      "/actuator/heapdump", "/actuator/threaddump", "/actuator/health/db", "/actuator/health/diskSpace"})
  void otherActuatorEndpointsAreNotReachable(String path) throws Exception {
    mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
    mockMvc.perform(get(path).header("Authorization", "Bearer " + accessToken()))
        .andExpect(status().isNotFound());
  }

  private String accessToken() throws Exception {
    String name = "test_" + UUID.randomUUID().toString().substring(0, 8);
    String body = """
        {"username":"%s","email":"%s@example.com","password":"password123"}
        """.formatted(name, name);
    String response = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    return JsonPath.read(response, "$.token");
  }
}
