package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SetLogControllerTest {

  private static final String PYRAMID = """
      {"completed":true,"sets":[
        {"reps":10,"weight":40,"warmup":true},
        {"reps":8,"weight":60},
        {"reps":8,"weight":65,"rpe":8},
        {"reps":6,"weight":70,"rpe":9.5}
      ]}""";

  @Autowired
  private MockMvc mockMvc;

  private String token;
  private long workoutId;
  private long sessionId;
  private long logId;

  @BeforeEach
  void setUp() throws Exception {
    token = register();
    long splitId = id(perform(post("/api/splits"), "{\"name\":\"Split\"}"));
    workoutId = id(perform(post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    perform(post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Bench Press\",\"sets\":3,\"reps\":8}")
        .andExpect(status().isCreated());
    sessionId = id(perform(post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    logId = firstLogId(sessionId);
  }

  @Test
  void setsAreStoredInOrderAndSummarized() throws Exception {
    perform(put("/api/training-logs/exercise-logs/" + logId), PYRAMID)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sets", hasSize(4)))
        .andExpect(jsonPath("$.sets[0].warmup").value(true))
        .andExpect(jsonPath("$.sets[2].weight").value(65.0))
        .andExpect(jsonPath("$.sets[3].rpe").value(9.5))
        // Summary: working sets only, heaviest set's reps and weight
        .andExpect(jsonPath("$.setsCompleted").value(3))
        .andExpect(jsonPath("$.repsCompleted").value(6))
        .andExpect(jsonPath("$.weightUsed").value(70.0));
  }

  @Test
  void sendingSetsAgainReplacesThem() throws Exception {
    perform(put("/api/training-logs/exercise-logs/" + logId), PYRAMID).andExpect(status().isOk());

    perform(put("/api/training-logs/exercise-logs/" + logId), "{\"sets\":[{\"reps\":5,\"weight\":80}]}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sets", hasSize(1)))
        .andExpect(jsonPath("$.setsCompleted").value(1));

    perform(put("/api/training-logs/exercise-logs/" + logId), PYRAMID).andExpect(status().isOk());
    perform(get("/api/training-logs/" + sessionId), null)
        .andExpect(jsonPath("$.exercises[0].sets", hasSize(4)))
        .andExpect(jsonPath("$.exercises[0].sets[1].weight").value(60.0));
  }

  @Test
  void summaryFieldsAreExpandedIntoIdenticalSets() throws Exception {
    perform(put("/api/training-logs/exercise-logs/" + logId),
        "{\"setsCompleted\":3,\"repsCompleted\":5,\"weightUsed\":100,\"completed\":true}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sets", hasSize(3)))
        .andExpect(jsonPath("$.sets[2].reps").value(5))
        .andExpect(jsonPath("$.sets[2].weight").value(100.0))
        .andExpect(jsonPath("$.sets[2].warmup").value(false));

    // Only toggling completion leaves the sets alone
    perform(put("/api/training-logs/exercise-logs/" + logId), "{\"completed\":false}")
        .andExpect(jsonPath("$.sets", hasSize(3)));
  }

  @Test
  void previousSessionAndProgressIncludeTheSets() throws Exception {
    perform(put("/api/training-logs/exercise-logs/" + logId), PYRAMID).andExpect(status().isOk());
    perform(put("/api/training-logs/" + sessionId + "/complete"), "{}").andExpect(status().isOk());

    long nextSessionId = id(perform(post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    String next = perform(get("/api/training-logs/" + nextSessionId), null)
        .andExpect(jsonPath("$.exercises[0].sets", hasSize(0)))
        .andExpect(jsonPath("$.exercises[0].previousWeight").value(70.0))
        .andExpect(jsonPath("$.exercises[0].previousSetLogs", hasSize(4)))
        .andExpect(jsonPath("$.exercises[0].previousSetLogs[1].weight").value(60.0))
        .andReturn().getResponse().getContentAsString();

    long libraryId = ((Number) JsonPath.read(next, "$.exercises[0].libraryExerciseId")).longValue();
    perform(get("/api/library-exercises/" + libraryId + "/progress"), null)
        .andExpect(jsonPath("$.entries", hasSize(1)))
        .andExpect(jsonPath("$.entries[0].sets", hasSize(4)))
        .andExpect(jsonPath("$.entries[0].weightUsed").value(70.0));
  }

  @Test
  void invalidSetsAreRejected() throws Exception {
    perform(put("/api/training-logs/exercise-logs/" + logId), "{\"sets\":[{\"reps\":-1}]}")
        .andExpect(status().isBadRequest());
    perform(put("/api/training-logs/exercise-logs/" + logId), "{\"sets\":[{\"reps\":5,\"rpe\":11}]}")
        .andExpect(status().isBadRequest());
    perform(put("/api/training-logs/exercise-logs/" + logId), "{\"sets\":[{\"weight\":50}]}")
        .andExpect(status().isBadRequest());
  }

  @Test
  void otherUsersCannotLogSets() throws Exception {
    String own = token;
    token = register();
    perform(put("/api/training-logs/exercise-logs/" + logId), PYRAMID).andExpect(status().isForbidden());
    token = own;
    perform(get("/api/training-logs/" + sessionId), null).andExpect(jsonPath("$.exercises[0].sets", hasSize(0)));
  }

  private long firstLogId(long trainingLogId) throws Exception {
    String session = perform(get("/api/training-logs/" + trainingLogId), null)
        .andReturn().getResponse().getContentAsString();
    return ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();
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

  private ResultActions perform(MockHttpServletRequestBuilder request, String body) throws Exception {
    request.header("Authorization", "Bearer " + token);
    if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
    return mockMvc.perform(request);
  }

  private static long id(ResultActions result) throws Exception {
    return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
  }
}
