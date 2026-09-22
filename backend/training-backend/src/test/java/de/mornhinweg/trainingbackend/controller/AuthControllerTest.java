package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private String register() throws Exception {
    String name = "test_" + UUID.randomUUID().toString().substring(0, 8);
    String body = """
        {"username":"%s","email":"%s@example.com","password":"password123"}
        """.formatted(name, name);
    return mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.token").isNotEmpty())
        .andExpect(jsonPath("$.refreshToken").isNotEmpty())
        .andReturn().getResponse().getContentAsString();
  }

  private static String refreshBody(String refreshToken) {
    return "{\"refreshToken\":\"" + refreshToken + "\"}";
  }

  @Test
  void missingTokenReturns401() throws Exception {
    mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
  }

  @Test
  void refreshRotatesTokenAndRejectsReuse() throws Exception {
    String refreshToken = JsonPath.read(register(), "$.refreshToken");

    String refreshed = mockMvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON).content(refreshBody(refreshToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty())
        .andReturn().getResponse().getContentAsString();

    String accessToken = JsonPath.read(refreshed, "$.token");
    mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk());

    // Refresh tokens are single use
    mockMvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON).content(refreshBody(refreshToken)))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void logoutRevokesRefreshToken() throws Exception {
    String refreshToken = JsonPath.read(register(), "$.refreshToken");

    mockMvc.perform(post("/api/auth/logout")
            .contentType(MediaType.APPLICATION_JSON).content(refreshBody(refreshToken)))
        .andExpect(status().isNoContent());

    mockMvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON).content(refreshBody(refreshToken)))
        .andExpect(status().isUnauthorized());
  }
}
