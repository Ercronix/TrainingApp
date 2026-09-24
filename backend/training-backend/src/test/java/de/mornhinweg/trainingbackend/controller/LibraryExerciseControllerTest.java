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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LibraryExerciseControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private String token;
  private long workoutA;
  private long workoutB;

  @BeforeEach
  void setUp() throws Exception {
    token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}").andExpect(status().isCreated()));
    workoutA = createWorkout(splitId, "Push");
    workoutB = createWorkout(splitId, "Upper");
  }

  @Test
  void exercisesWithTheSameNameShareOneLibraryEntry() throws Exception {
    long first = libraryId(createExercise(workoutA, "{\"name\":\"Bench Press\",\"repUnit\":\"reps\"}"));
    long second = libraryId(createExercise(workoutB, "{\"name\":\"  bench press \"}"));
    long byId = libraryId(createExercise(workoutB, "{\"libraryExerciseId\":" + first + "}"));

    assertEquals(first, second);
    assertEquals(first, byId);

    perform(token, get("/api/library-exercises"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value("Bench Press"))
        .andExpect(jsonPath("$[0].workoutCount").value(3));
  }

  @Test
  void libraryDetailsApplyToEveryWorkout() throws Exception {
    String a = createExercise(workoutA, "{\"name\":\"Squat\"}");
    long libraryId = libraryId(a);
    createExercise(workoutB, "{\"name\":\"Squat\"}");

    perform(token, put("/api/library-exercises/" + libraryId), "{\"name\":\"Back Squat\",\"repUnit\":\"seconds\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.workoutCount").value(2));

    perform(token, get("/api/workouts/" + workoutB + "/exercises"), null)
        .andExpect(jsonPath("$[0].name").value("Back Squat"))
        .andExpect(jsonPath("$[0].repUnit").value("seconds"));
  }

  @Test
  void renamingAWorkoutExerciseRelinksIt() throws Exception {
    long exerciseId = id(createExercise(workoutA, "{\"name\":\"Row\"}"));
    long rowLibraryId = libraryId(createExercise(workoutB, "{\"name\":\"Row\"}"));

    String updated = perform(token, put("/api/workouts/" + workoutA + "/exercises/" + exerciseId), "{\"name\":\"Pendlay Row\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Pendlay Row"))
        .andReturn().getResponse().getContentAsString();
    assertNotEquals(rowLibraryId, libraryId(updated));

    // The other workout keeps the original entry
    perform(token, get("/api/workouts/" + workoutB + "/exercises"), null)
        .andExpect(jsonPath("$[0].name").value("Row"));
  }

  @Test
  void renamingAnUnsharedExerciseRenamesItsEntry() throws Exception {
    String created = createExercise(workoutA, "{\"name\":\"Bench\",\"description\":\"Pause on chest\",\"repUnit\":\"seconds\"}");

    String updated = perform(token, put("/api/workouts/" + workoutA + "/exercises/" + id(created)), "{\"name\":\"Bench Press\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Bench Press"))
        .andExpect(jsonPath("$.description").value("Pause on chest"))
        .andExpect(jsonPath("$.repUnit").value("seconds"))
        .andReturn().getResponse().getContentAsString();
    assertEquals(libraryId(created), libraryId(updated));

    perform(token, get("/api/library-exercises"), null).andExpect(jsonPath("$", hasSize(1)));
  }

  @Test
  void renamingASharedExerciseKeepsItsDetails() throws Exception {
    long exerciseId = id(createExercise(workoutA, "{\"name\":\"Plank\",\"description\":\"Squeeze glutes\",\"repUnit\":\"seconds\"}"));
    createExercise(workoutB, "{\"name\":\"Plank\"}");

    perform(token, put("/api/workouts/" + workoutA + "/exercises/" + exerciseId), "{\"name\":\"Side Plank\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Side Plank"))
        .andExpect(jsonPath("$.description").value("Squeeze glutes"))
        .andExpect(jsonPath("$.repUnit").value("seconds"));

    // A new exercise without a rep unit leaves the shared entry's unit alone
    perform(token, get("/api/workouts/" + workoutB + "/exercises"), null)
        .andExpect(jsonPath("$[0].name").value("Plank"))
        .andExpect(jsonPath("$[0].repUnit").value("seconds"));
  }

  @Test
  void progressAndPreviousValuesSpanWorkouts() throws Exception {
    long libraryId = libraryId(createExercise(workoutA, "{\"name\":\"Deadlift\"}"));
    createExercise(workoutB, "{\"name\":\"Deadlift\"}");

    // Train it in workout A
    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutA + "}"));
    String session = perform(token, get("/api/training-logs/" + sessionId), null)
        .andReturn().getResponse().getContentAsString();
    long logId = ((Number) JsonPath.read(session, "$.exercises[0].id")).longValue();
    perform(token, put("/api/training-logs/exercise-logs/" + logId),
        "{\"setsCompleted\":3,\"repsCompleted\":5,\"weightUsed\":140,\"completed\":true}")
        .andExpect(status().isOk());
    perform(token, put("/api/training-logs/" + sessionId + "/complete"), "{}").andExpect(status().isOk());

    // Starting workout B shows what was done in workout A
    long nextSessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutB + "}"));
    perform(token, get("/api/training-logs/" + nextSessionId), null)
        .andExpect(jsonPath("$.exercises[0].libraryExerciseId").value(libraryId))
        .andExpect(jsonPath("$.exercises[0].previousWeight").value(140.0));

    perform(token, get("/api/library-exercises/" + libraryId + "/progress"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.entries", hasSize(1)))
        .andExpect(jsonPath("$.entries[0].workoutName").value("Push"));
  }

  @Test
  void duplicateNamesAndDeletingUsedEntriesAreRejected() throws Exception {
    long usedId = libraryId(createExercise(workoutA, "{\"name\":\"Dips\"}"));
    long unusedId = id(perform(token, post("/api/library-exercises"), "{\"name\":\"Chin-up\"}")
        .andExpect(status().isCreated()));

    perform(token, post("/api/library-exercises"), "{\"name\":\"DIPS\"}").andExpect(status().isConflict());
    perform(token, put("/api/library-exercises/" + unusedId), "{\"name\":\"dips\"}").andExpect(status().isConflict());
    perform(token, delete("/api/library-exercises/" + usedId), null).andExpect(status().isConflict());
    perform(token, delete("/api/library-exercises/" + unusedId), null).andExpect(status().isNoContent());
  }

  @Test
  void otherUsersCannotUseAnEntry() throws Exception {
    long libraryId = libraryId(createExercise(workoutA, "{\"name\":\"Curl\"}"));

    String other = register();
    long otherSplit = id(perform(other, post("/api/splits"), "{\"name\":\"Other\"}"));
    long otherWorkout = id(perform(other, post("/api/workouts/split/" + otherSplit), "{\"name\":\"Arms\"}"));

    perform(other, get("/api/library-exercises"), null).andExpect(jsonPath("$", hasSize(0)));
    perform(other, get("/api/library-exercises/" + libraryId + "/progress"), null).andExpect(status().isNotFound());
    perform(other, put("/api/library-exercises/" + libraryId), "{\"name\":\"Mine\"}").andExpect(status().isNotFound());
    perform(other, delete("/api/library-exercises/" + libraryId), null).andExpect(status().isNotFound());
    perform(other, post("/api/workouts/" + otherWorkout + "/exercises"), "{\"libraryExerciseId\":" + libraryId + "}")
        .andExpect(status().isNotFound());
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

  private long createWorkout(long splitId, String name) throws Exception {
    return id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"" + name + "\"}"));
  }

  private String createExercise(long workoutId, String body) throws Exception {
    return perform(token, post("/api/workouts/" + workoutId + "/exercises"), body)
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
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

  private static long libraryId(String json) {
    return ((Number) JsonPath.read(json, "$.libraryExerciseId")).longValue();
  }
}
