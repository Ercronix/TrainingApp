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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Workouts and their planned exercises. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class WorkoutControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private String token;
  private long splitId;
  private long workoutId;

  @BeforeEach
  void setUp() throws Exception {
    token = register();
    splitId = id(perform(post("/api/splits"), "{\"name\":\"Split\"}"));
    workoutId = id(perform(post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
  }

  @Test
  void workoutCanBeRenamed() throws Exception {
    perform(put("/api/workouts/" + workoutId), "{\"name\":\"Pull\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(workoutId))
        .andExpect(jsonPath("$.name").value("Pull"));
    perform(put("/api/workouts/" + workoutId), "{\"name\":\"\"}").andExpect(status().isBadRequest());

    perform(get("/api/workouts/" + workoutId), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Pull"));
  }

  @Test
  void deletingAWorkoutRemovesItsExercisesAndHistory() throws Exception {
    long exerciseId = createExercise("{\"name\":\"Bench\",\"sets\":3,\"reps\":5}");
    long sessionId = id(perform(post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    perform(put("/api/training-logs/" + sessionId + "/complete"), "{}").andExpect(status().isOk());

    perform(delete("/api/workouts/" + workoutId), null).andExpect(status().isNoContent());

    perform(get("/api/workouts/" + workoutId), null).andExpect(status().isNotFound());
    perform(get("/api/workouts/split/" + splitId), null).andExpect(jsonPath("$", hasSize(0)));
    perform(get("/api/exercises/" + exerciseId + "/progress"), null).andExpect(status().isNotFound());
    perform(get("/api/training-logs/" + sessionId), null).andExpect(status().isNotFound());
    perform(delete("/api/workouts/" + workoutId), null).andExpect(status().isNotFound());
  }

  @Test
  void exerciseCanBeUpdated() throws Exception {
    long exerciseId = createExercise("{\"name\":\"Bench\",\"sets\":3,\"reps\":5}");

    perform(put("/api/workouts/" + workoutId + "/exercises/" + exerciseId),
        "{\"sets\":4,\"reps\":8,\"plannedWeight\":82.5,\"description\":\"Pause at the chest\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(exerciseId))
        .andExpect(jsonPath("$.name").value("Bench"))
        .andExpect(jsonPath("$.sets").value(4))
        .andExpect(jsonPath("$.reps").value(8))
        .andExpect(jsonPath("$.plannedWeight").value(82.5))
        .andExpect(jsonPath("$.description").value("Pause at the chest"));

    // Fields left out stay as they are
    perform(put("/api/workouts/" + workoutId + "/exercises/" + exerciseId), "{\"reps\":10}")
        .andExpect(status().isOk());
    perform(get("/api/workouts/" + workoutId + "/exercises"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].sets").value(4))
        .andExpect(jsonPath("$[0].reps").value(10))
        .andExpect(jsonPath("$[0].plannedWeight").value(82.5))
        .andExpect(jsonPath("$[0].description").value("Pause at the chest"));
  }

  @Test
  void exercisesCanBeReordered() throws Exception {
    long bench = createExercise("{\"name\":\"Bench\"}");
    long dips = createExercise("{\"name\":\"Dips\"}");
    long flyes = createExercise("{\"name\":\"Flyes\"}");

    perform(patch("/api/workouts/" + workoutId + "/exercises/reorder"), """
        {"exercises":[{"id":%d,"orderIndex":2},{"id":%d,"orderIndex":0},{"id":%d,"orderIndex":1}]}
        """.formatted(bench, flyes, dips))
        .andExpect(status().isNoContent());

    perform(get("/api/workouts/" + workoutId + "/exercises"), null)
        .andExpect(jsonPath("$[0].name").value("Flyes"))
        .andExpect(jsonPath("$[1].name").value("Dips"))
        .andExpect(jsonPath("$[2].name").value("Bench"))
        .andExpect(jsonPath("$[2].orderIndex").value(2));
  }

  @Test
  void exerciseCanBeDeleted() throws Exception {
    long bench = createExercise("{\"name\":\"Bench\"}");
    createExercise("{\"name\":\"Dips\"}");

    perform(delete("/api/workouts/" + workoutId + "/exercises/" + bench), null).andExpect(status().isNoContent());
    perform(delete("/api/workouts/" + workoutId + "/exercises/" + bench), null).andExpect(status().isNotFound());

    perform(get("/api/workouts/" + workoutId + "/exercises"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value("Dips"));
    perform(get("/api/workouts/" + workoutId), null).andExpect(jsonPath("$.exerciseCount").value(1));
  }

  @Test
  void exerciseProgressListsCompletedSessions() throws Exception {
    long exerciseId = createExercise("{\"name\":\"Bench\",\"sets\":2,\"reps\":5}");

    perform(get("/api/exercises/" + exerciseId + "/progress"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.exerciseId").value(exerciseId))
        .andExpect(jsonPath("$.exerciseName").value("Bench"))
        .andExpect(jsonPath("$.entries", hasSize(0)));

    long sessionId = id(perform(post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    String session = perform(get("/api/training-logs/" + sessionId), null).andReturn().getResponse().getContentAsString();
    long logId = ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();
    long libraryId = ((Number) JsonPath.read(session, "$.exercises[0].libraryExerciseId")).longValue();
    perform(put("/api/training-logs/exercise-logs/" + logId),
        "{\"completed\":true,\"sets\":[{\"reps\":5,\"weight\":100},{\"reps\":4,\"weight\":105}]}")
        .andExpect(status().isOk());

    // A running session doesn't count yet
    perform(get("/api/exercises/" + exerciseId + "/progress"), null).andExpect(jsonPath("$.entries", hasSize(0)));
    perform(put("/api/training-logs/" + sessionId + "/complete"), "{}").andExpect(status().isOk());

    perform(get("/api/exercises/" + exerciseId + "/progress"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.exerciseId").value(exerciseId))
        .andExpect(jsonPath("$.libraryExerciseId").value(libraryId))
        .andExpect(jsonPath("$.entries", hasSize(1)))
        .andExpect(jsonPath("$.entries[0].trainingLogId").value(sessionId))
        .andExpect(jsonPath("$.entries[0].workoutName").value("Push"))
        .andExpect(jsonPath("$.entries[0].sets", hasSize(2)))
        .andExpect(jsonPath("$.entries[0].weightUsed").value(105.0));
    perform(get("/api/exercises/999999999/progress"), null).andExpect(status().isNotFound());
  }

  private long createExercise(String body) throws Exception {
    return id(perform(post("/api/workouts/" + workoutId + "/exercises"), body).andExpect(status().isCreated()));
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
