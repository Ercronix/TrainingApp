package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import de.mornhinweg.trainingbackend.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Planned rep ranges, the library entry's weight increment, and what a session needs for the suggested next target. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class RepRangeControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private String token;
  private long workoutId;

  @BeforeEach
  void setUp() throws Exception {
    token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}"));
    workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
  }

  @Test
  void repRangeRoundTrips() throws Exception {
    String created = createExercise("{\"name\":\"Bench\",\"sets\":3,\"reps\":8,\"repsMax\":12,\"plannedWeight\":60}");
    long exerciseId = id(created);
    assertEquals(12, (int) JsonPath.read(created, "$.repsMax"));

    perform(token, get("/api/workouts/" + workoutId + "/exercises"), null)
        .andExpect(jsonPath("$[0].reps").value(8))
        .andExpect(jsonPath("$[0].repsMax").value(12));

    // Changing only the bottom keeps the top
    perform(token, put(exerciseUrl(exerciseId)), "{\"reps\":10}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.reps").value(10))
        .andExpect(jsonPath("$.repsMax").value(12));
    // Left out, the range stays; 0 makes the rep count fixed again
    perform(token, put(exerciseUrl(exerciseId)), "{\"sets\":4}")
        .andExpect(jsonPath("$.repsMax").value(12));
    perform(token, put(exerciseUrl(exerciseId)), "{\"repsMax\":0}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.reps").value(10))
        .andExpect(jsonPath("$.repsMax").value(nullValue()));
    // A range whose top is its bottom is a fixed count
    perform(token, put(exerciseUrl(exerciseId)), "{\"repsMax\":10}")
        .andExpect(jsonPath("$.repsMax").value(nullValue()));

    // Without a top it's a fixed rep count, as before
    long fixed = id(createExercise("{\"name\":\"Dips\",\"sets\":3,\"reps\":10}"));
    perform(token, get("/api/workouts/" + workoutId + "/exercises"), null)
        .andExpect(jsonPath("$[1].id").value(fixed))
        .andExpect(jsonPath("$[1].repsMax").value(nullValue()));
  }

  @Test
  void invalidRepRangesAreRejected() throws Exception {
    String exercises = "/api/workouts/" + workoutId + "/exercises";
    perform(token, post(exercises), "{\"name\":\"Bench\",\"reps\":12,\"repsMax\":8}").andExpect(status().isBadRequest());
    perform(token, post(exercises), "{\"name\":\"Bench\",\"repsMax\":8}").andExpect(status().isBadRequest());
    perform(token, post(exercises), "{\"name\":\"Bench\",\"reps\":8,\"repsMax\":-1}").andExpect(status().isBadRequest());
    perform(token, get(exercises), null).andExpect(jsonPath("$", hasSize(0)));

    long exerciseId = id(createExercise("{\"name\":\"Bench\",\"sets\":3,\"reps\":8,\"repsMax\":12}"));
    perform(token, put(exerciseUrl(exerciseId)), "{\"repsMax\":6}").andExpect(status().isBadRequest());
    // A new bottom above the current top
    perform(token, put(exerciseUrl(exerciseId)), "{\"reps\":15}").andExpect(status().isBadRequest());
    perform(token, put(exerciseUrl(exerciseId)), "{\"reps\":15,\"repsMax\":10}").andExpect(status().isBadRequest());
    perform(token, get(exercises), null)
        .andExpect(jsonPath("$[0].reps").value(8))
        .andExpect(jsonPath("$[0].repsMax").value(12));
    // Moving both together is fine
    perform(token, put(exerciseUrl(exerciseId)), "{\"reps\":15,\"repsMax\":20}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.reps").value(15))
        .andExpect(jsonPath("$.repsMax").value(20));

    // Exercises added to or swapped into a session too
    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    perform(token, post("/api/training-logs/" + sessionId + "/exercise-logs"),
        "{\"name\":\"Flyes\",\"reps\":12,\"repsMax\":10,\"addToWorkout\":false}").andExpect(status().isBadRequest());
    String session = perform(token, get("/api/training-logs/" + sessionId), null).andReturn().getResponse().getContentAsString();
    long logId = ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();
    perform(token, put("/api/training-logs/exercise-logs/" + logId + "/replace"),
        "{\"name\":\"Flyes\",\"reps\":12,\"repsMax\":10}").andExpect(status().isBadRequest());
    perform(token, get("/api/training-logs/" + sessionId), null)
        .andExpect(jsonPath("$.exercises", hasSize(1)))
        .andExpect(jsonPath("$.exercises[0].exerciseName").value("Bench"));
  }

  @Test
  void sessionCarriesThePlannedRangeAndTheLastTwoSessions() throws Exception {
    createExercise("{\"name\":\"Bench\",\"sets\":2,\"reps\":8,\"repsMax\":12,\"plannedWeight\":60}");

    String first = startSession();
    long libraryId = ((Number) JsonPath.read(first, "$.exercises[0].libraryExerciseId")).longValue();
    perform(token, get("/api/training-logs/" + id(first)), null)
        .andExpect(jsonPath("$.exercises[0].plannedReps").value(8))
        .andExpect(jsonPath("$.exercises[0].plannedRepsMax").value(12))
        .andExpect(jsonPath("$.exercises[0].weightIncrement").value(nullValue()))
        .andExpect(jsonPath("$.exercises[0].previousSetLogs").value(nullValue()))
        .andExpect(jsonPath("$.exercises[0].earlierSetLogs").value(nullValue()));
    logAndComplete(first, "[{\"reps\":7,\"weight\":60},{\"reps\":6,\"weight\":60}]");

    String second = startSession();
    perform(token, get("/api/training-logs/" + id(second)), null)
        .andExpect(jsonPath("$.exercises[0].previousSetLogs", hasSize(2)))
        .andExpect(jsonPath("$.exercises[0].previousSetLogs[0].reps").value(7))
        .andExpect(jsonPath("$.exercises[0].earlierSetLogs").value(nullValue()));
    logAndComplete(second, "[{\"reps\":10,\"weight\":5,\"warmup\":true},{\"reps\":7,\"weight\":60},{\"reps\":7,\"weight\":60}]");

    perform(token, put("/api/library-exercises/" + libraryId), "{\"weightIncrement\":1.25}").andExpect(status().isOk());

    String third = startSession();
    perform(token, get("/api/training-logs/" + id(third)), null)
        .andExpect(jsonPath("$.exercises[0].weightIncrement").value(1.25))
        .andExpect(jsonPath("$.exercises[0].previousSetLogs", hasSize(3)))
        .andExpect(jsonPath("$.exercises[0].previousSetLogs[0].warmup").value(true))
        .andExpect(jsonPath("$.exercises[0].earlierSetLogs", hasSize(2)))
        .andExpect(jsonPath("$.exercises[0].earlierSetLogs[1].reps").value(6));
  }

  @Test
  void weightIncrementCanBeSetAndReset() throws Exception {
    long libraryId = ((Number) JsonPath.read(createExercise("{\"name\":\"Curl\"}"), "$.libraryExerciseId")).longValue();
    String entry = "/api/library-exercises/" + libraryId;

    perform(token, put(entry), "{\"weightIncrement\":1}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.weightIncrement").value(1.0));
    // Other edits leave it alone
    perform(token, put(entry), "{\"description\":\"Slow\"}").andExpect(jsonPath("$.weightIncrement").value(1.0));
    perform(token, put(entry), "{\"weightIncrement\":-2.5}").andExpect(status().isBadRequest());
    perform(token, put(entry), "{\"weightIncrement\":500}").andExpect(status().isBadRequest());
    perform(token, get("/api/library-exercises"), null).andExpect(jsonPath("$[0].weightIncrement").value(1.0));
    // 0 goes back to the default
    perform(token, put(entry), "{\"weightIncrement\":0}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.weightIncrement").value(nullValue()));

    perform(token, post("/api/library-exercises"), "{\"name\":\"Lateral Raise\",\"weightIncrement\":2}")
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.weightIncrement").value(2.0));
  }

  @Test
  void otherUsersCannotChangeTheRangeOrTheIncrement() throws Exception {
    String created = createExercise("{\"name\":\"Bench\",\"sets\":3,\"reps\":8,\"repsMax\":12}");
    long exerciseId = id(created);
    long libraryId = ((Number) JsonPath.read(created, "$.libraryExerciseId")).longValue();
    perform(token, put("/api/library-exercises/" + libraryId), "{\"weightIncrement\":5}").andExpect(status().isOk());

    String other = register();
    perform(other, put(exerciseUrl(exerciseId)), "{\"repsMax\":15}").andExpect(status().isForbidden());
    perform(other, put("/api/library-exercises/" + libraryId), "{\"weightIncrement\":1}").andExpect(status().isNotFound());

    perform(token, get("/api/workouts/" + workoutId + "/exercises"), null)
        .andExpect(jsonPath("$[0].repsMax").value(12));
    perform(token, get("/api/library-exercises"), null)
        .andExpect(jsonPath("$[0].weightIncrement").value(5.0));
  }

  private String exerciseUrl(long exerciseId) {
    return "/api/workouts/" + workoutId + "/exercises/" + exerciseId;
  }

  private String createExercise(String body) throws Exception {
    return perform(token, post("/api/workouts/" + workoutId + "/exercises"), body)
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
  }

  private String startSession() throws Exception {
    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    return perform(token, get("/api/training-logs/" + sessionId), null).andReturn().getResponse().getContentAsString();
  }

  private void logAndComplete(String session, String sets) throws Exception {
    long logId = ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();
    perform(token, put("/api/training-logs/exercise-logs/" + logId), "{\"completed\":true,\"sets\":" + sets + "}")
        .andExpect(status().isOk());
    perform(token, put("/api/training-logs/" + id(session) + "/complete"), "{}").andExpect(status().isOk());
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
    return id(result.andReturn().getResponse().getContentAsString());
  }

  private static long id(String json) {
    return ((Number) JsonPath.read(json, "$.id")).longValue();
  }
}
