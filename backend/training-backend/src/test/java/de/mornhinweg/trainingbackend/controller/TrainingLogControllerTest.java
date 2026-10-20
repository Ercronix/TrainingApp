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
import static org.junit.jupiter.api.Assertions.assertTrue;
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
  void timestampsAreSentAsUtc() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"PPL\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    String session = perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}")
        .andReturn().getResponse().getContentAsString();

    // With the zone, so clients don't read it as their own local time
    String startedAt = JsonPath.read(session, "$.startedAt");
    long secondsAgo = java.time.Duration.between(java.time.Instant.parse(startedAt), java.time.Instant.now()).getSeconds();
    assertTrue(secondsAgo >= 0 && secondsAgo < 60, "startedAt " + startedAt + " is " + secondsAgo + "s ago");
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

  @Test
  void replacingKeepsThePlaceAndLeavesTheWorkoutAlone() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    perform(token, post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Bench\",\"sets\":2,\"reps\":5}");
    perform(token, post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Dips\",\"sets\":3,\"reps\":8}");
    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    String session = perform(token, get("/api/training-logs/" + sessionId), null)
        .andReturn().getResponse().getContentAsString();
    long benchLogId = ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();
    perform(token, put("/api/training-logs/exercise-logs/" + benchLogId), "{\"completed\":true,\"sets\":[{\"reps\":5,\"weight\":100}]}")
        .andExpect(status().isOk());

    perform(token, put("/api/training-logs/exercise-logs/" + benchLogId + "/replace"), "{\"name\":\"Dumbbell Press\",\"sets\":3,\"reps\":10}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(benchLogId))
        .andExpect(jsonPath("$.exerciseName").value("Dumbbell Press"))
        .andExpect(jsonPath("$.plannedSets").value(3))
        .andExpect(jsonPath("$.sets.length()").value(0))
        .andExpect(jsonPath("$.completed").value(false));

    perform(token, get("/api/training-logs/" + sessionId), null)
        .andExpect(jsonPath("$.exercises.length()").value(2))
        .andExpect(jsonPath("$.exercises[0].exerciseName").value("Dumbbell Press"))
        .andExpect(jsonPath("$.exercises[1].exerciseName").value("Dips"));
    perform(token, get("/api/workouts/" + workoutId + "/exercises"), null)
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].name").value("Bench"));

    // The replacement can be replaced again (which drops its session-only exercise)
    perform(token, put("/api/training-logs/exercise-logs/" + benchLogId + "/replace"), "{\"name\":\"Push-Up\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.exerciseName").value("Push-Up"));
  }

  @Test
  void deletingRemovesTheExerciseFromTheSessionOnly() throws Exception {
    String token = register();
    String otherToken = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    perform(token, post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Bench\",\"sets\":2,\"reps\":5}");
    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    long curlLogId = id(perform(token, post("/api/training-logs/" + sessionId + "/exercise-logs"), "{\"name\":\"Curl\",\"addToWorkout\":false}"));
    String session = perform(token, get("/api/training-logs/" + sessionId), null)
        .andReturn().getResponse().getContentAsString();
    long benchLogId = ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();

    perform(otherToken, delete("/api/training-logs/exercise-logs/" + benchLogId), null)
        .andExpect(status().isForbidden());
    perform(token, delete("/api/training-logs/exercise-logs/" + benchLogId), null)
        .andExpect(status().isNoContent());
    perform(token, delete("/api/training-logs/exercise-logs/" + benchLogId), null)
        .andExpect(status().isNotFound());
    // Added for this session only, so its exercise goes with it
    perform(token, delete("/api/training-logs/exercise-logs/" + curlLogId), null)
        .andExpect(status().isNoContent());

    perform(token, get("/api/training-logs/" + sessionId), null)
        .andExpect(jsonPath("$.exercises.length()").value(0));
    perform(token, get("/api/workouts/" + workoutId + "/exercises"), null)
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].name").value("Bench"));
  }

  @Test
  void exercisesOfACompletedSessionCantBeReplacedOrDeleted() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    perform(token, post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Bench\",\"sets\":2,\"reps\":5}");
    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    String session = perform(token, put("/api/training-logs/" + sessionId + "/complete"), "{}")
        .andReturn().getResponse().getContentAsString();
    long logId = ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();

    perform(token, put("/api/training-logs/exercise-logs/" + logId + "/replace"), "{\"name\":\"Dips\"}")
        .andExpect(status().isBadRequest());
    perform(token, delete("/api/training-logs/exercise-logs/" + logId), null)
        .andExpect(status().isBadRequest());
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
