package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TrainingLogControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void completingTwiceKeepsTheFirstCompletion() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));

    perform(token, put("/api/training-logs/" + sessionId + "/complete"), "{\"notes\":\"Felt good\"}")
        .andExpect(status().isOk());
    // Read back from the DB so timestamps have the stored precision
    String first = perform(token, get("/api/training-logs/" + sessionId), null)
        .andReturn().getResponse().getContentAsString();

    String second = perform(token, put("/api/training-logs/" + sessionId + "/complete"), "{\"notes\":\"Overwritten\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.isCompleted").value(true))
        .andExpect(jsonPath("$.notes").value("Felt good"))
        .andReturn().getResponse().getContentAsString();

    assertEquals((String) JsonPath.read(first, "$.completedAt"), JsonPath.read(second, "$.completedAt"));
    assertEquals((Integer) JsonPath.read(first, "$.durationSeconds"), JsonPath.read(second, "$.durationSeconds"));
  }

  private String register() throws Exception {
    String name = "test_" + UUID.randomUUID().toString().substring(0, 8);
    String body = """
        {"username":"%s","email":"%s@example.com","password":"password123"}
        """.formatted(name, name);
    String response = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    return JsonPath.read(response, "$.token");
  }

  private ResultActions perform(String accessToken, MockHttpServletRequestBuilder request, String body) throws Exception {
    request.header("Authorization", "Bearer " + accessToken);
    if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
    return mockMvc.perform(request);
  }

  private static long id(ResultActions result) throws Exception {
    return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
  }
}
