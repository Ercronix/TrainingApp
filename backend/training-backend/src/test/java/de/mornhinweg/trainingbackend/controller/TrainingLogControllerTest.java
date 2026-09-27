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

import static org.hamcrest.Matchers.nullValue;
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

  @Test
  void completedSecondsAgoBackdatesButNotBeforeTheStart() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));

    perform(token, put("/api/training-logs/" + sessionId + "/complete"), "{\"completedSecondsAgo\":-1}")
        .andExpect(status().isBadRequest());

    // Finished "a day ago", i.e. before the session started: clamped to the start
    perform(token, put("/api/training-logs/" + sessionId + "/complete"), "{\"completedSecondsAgo\":86400}")
        .andExpect(status().isOk());
    String session = perform(token, get("/api/training-logs/" + sessionId), null)
        .andReturn().getResponse().getContentAsString();

    assertEquals((String) JsonPath.read(session, "$.startedAt"), JsonPath.read(session, "$.completedAt"));
    assertEquals(0, (Integer) JsonPath.read(session, "$.durationSeconds"));
  }

  @Test
  void sessionsCarryTheBestsOfEarlierSessions() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    perform(token, post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Bench\",\"sets\":2,\"reps\":5}")
        .andExpect(status().isCreated());

    long firstId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    String first = perform(token, get("/api/training-logs/" + firstId), null)
        .andExpect(jsonPath("$.exercises[0].bestWeight").value(nullValue()))
        .andReturn().getResponse().getContentAsString();
    long firstLogId = ((Number) JsonPath.read(first, "$.exercises[0].id")).longValue();
    // The warm-up is heavier but doesn't count
    perform(token, put("/api/training-logs/exercise-logs/" + firstLogId), """
        {"completed":true,"sets":[
          {"reps":1,"weight":140,"warmup":true},
          {"reps":5,"weight":100},
          {"reps":10,"weight":80}]}
        """).andExpect(status().isOk());
    perform(token, put("/api/training-logs/" + firstId + "/complete"), "{}")
        .andExpect(status().isOk());

    long secondId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    String second = perform(token, get("/api/training-logs/" + secondId), null)
        .andReturn().getResponse().getContentAsString();

    assertEquals(100.0, ((Number) JsonPath.read(second, "$.exercises[0].bestWeight")).doubleValue());
    // Epley: 100 × (1 + 5/30) beats 80 × (1 + 10/30)
    assertEquals(100 * (1 + 5 / 30.0), ((Number) JsonPath.read(second, "$.exercises[0].bestOneRepMax")).doubleValue(), 0.01);
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
