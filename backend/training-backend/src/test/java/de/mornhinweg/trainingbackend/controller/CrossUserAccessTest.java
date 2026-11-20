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

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * User B calls every endpoint that takes an id with user A's ids, and A's data must stay hidden and
 * unchanged. Ownership is checked by hand in each service method, so this guards against a missing
 * check. The status follows the service's lookup: ids looked up together with the user (splits,
 * training logs, library entries) give 404, ids loaded first and then compared with the user
 * (workouts, workout exercises, exercise logs) give 403.
 * Library entries and stretch items are also covered in their own test classes.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class CrossUserAccessTest {

  @Autowired
  private MockMvc mockMvc;

  // User A's data
  private String a;
  private long splitA;
  private long workoutA;
  private long benchA;
  private long squatA;
  private long libraryA;
  private long completedSessionA;
  private long runningSessionA;
  private long runningLogA;

  // User B's own data, to try linking A's data into it
  private String b;
  private long splitB;
  private long workoutB;
  private long exerciseB;
  private long sessionB;
  private long logB;

  @BeforeEach
  void setUp() throws Exception {
    a = register();
    splitA = id(perform(a, post("/api/splits"), "{\"name\":\"A split\"}"));
    perform(a, put("/api/splits/" + splitA + "/activate"), null).andExpect(status().isOk());
    workoutA = id(perform(a, post("/api/workouts/split/" + splitA), "{\"name\":\"Push\"}"));
    String bench = perform(a, post("/api/workouts/" + workoutA + "/exercises"), "{\"name\":\"Bench\",\"sets\":3,\"reps\":5}")
        .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
    benchA = ((Number) JsonPath.read(bench, "$.id")).longValue();
    libraryA = ((Number) JsonPath.read(bench, "$.libraryExerciseId")).longValue();
    squatA = id(perform(a, post("/api/workouts/" + workoutA + "/exercises"), "{\"name\":\"Squat\",\"sets\":4,\"reps\":6}"));

    completedSessionA = id(perform(a, post("/api/training-logs/start"), "{\"workoutId\":" + workoutA + "}"));
    long completedLog = firstLogId(a, completedSessionA);
    perform(a, put("/api/training-logs/exercise-logs/" + completedLog), "{\"completed\":true,\"sets\":[{\"reps\":5,\"weight\":100}]}")
        .andExpect(status().isOk());
    perform(a, put("/api/training-logs/" + completedSessionA + "/complete"), "{\"notes\":\"A's notes\"}")
        .andExpect(status().isOk());

    runningSessionA = id(perform(a, post("/api/training-logs/start"), "{\"workoutId\":" + workoutA + "}"));
    runningLogA = firstLogId(a, runningSessionA);
    perform(a, put("/api/training-logs/exercise-logs/" + runningLogA), "{\"sets\":[{\"reps\":5,\"weight\":90}],\"notes\":\"A's set\"}")
        .andExpect(status().isOk());

    b = register();
    splitB = id(perform(b, post("/api/splits"), "{\"name\":\"B split\"}"));
    perform(b, put("/api/splits/" + splitB + "/activate"), null).andExpect(status().isOk());
    workoutB = id(perform(b, post("/api/workouts/split/" + splitB), "{\"name\":\"Legs\"}"));
    exerciseB = id(perform(b, post("/api/workouts/" + workoutB + "/exercises"), "{\"name\":\"Lunge\",\"sets\":3,\"reps\":10}"));
    sessionB = id(perform(b, post("/api/training-logs/start"), "{\"workoutId\":" + workoutB + "}"));
    logB = firstLogId(b, sessionB);
  }

  @Test
  void splitsOfOthersCannotBeSeenOrChanged() throws Exception {
    perform(b, get("/api/splits"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[*].id", not(hasItem((int) splitA))));
    perform(b, put("/api/splits/" + splitA), "{\"name\":\"Taken\",\"currentBlock\":2}").andExpect(status().isNotFound());
    perform(b, put("/api/splits/" + splitA + "/activate"), null).andExpect(status().isNotFound());
    perform(b, delete("/api/splits/" + splitA), null).andExpect(status().isNotFound());

    perform(a, get("/api/splits/active"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(splitA))
        .andExpect(jsonPath("$.name").value("A split"))
        .andExpect(jsonPath("$.currentBlock").value(1))
        .andExpect(jsonPath("$.workoutCount").value(1));
    // The failed activation deactivates B's splits before the lookup fails, which must be rolled back
    perform(b, get("/api/splits/active"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(splitB));
  }

  @Test
  void workoutsOfOthersCannotBeSeenOrChanged() throws Exception {
    perform(b, get("/api/workouts/split/" + splitA), null).andExpect(status().isNotFound());
    perform(b, post("/api/workouts/split/" + splitA), "{\"name\":\"Planted\"}").andExpect(status().isNotFound());
    perform(b, get("/api/workouts/" + workoutA), null).andExpect(status().isForbidden());
    perform(b, put("/api/workouts/" + workoutA), "{\"name\":\"Taken\"}").andExpect(status().isForbidden());
    perform(b, delete("/api/workouts/" + workoutA), null).andExpect(status().isForbidden());

    perform(a, get("/api/workouts/split/" + splitA), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].id").value(workoutA))
        .andExpect(jsonPath("$[0].name").value("Push"))
        .andExpect(jsonPath("$[0].exerciseCount").value(2));
  }

  @Test
  void workoutExercisesOfOthersCannotBeSeenOrChanged() throws Exception {
    String exercises = "/api/workouts/" + workoutA + "/exercises";
    perform(b, get(exercises), null).andExpect(status().isForbidden());
    perform(b, post(exercises), "{\"name\":\"Planted\",\"sets\":1,\"reps\":1}").andExpect(status().isForbidden());
    perform(b, put(exercises + "/" + benchA), "{\"name\":\"Taken\",\"sets\":9,\"reps\":9,\"description\":\"hacked\"}")
        .andExpect(status().isForbidden());
    perform(b, patch(exercises + "/reorder"),
        "{\"exercises\":[{\"id\":" + benchA + ",\"orderIndex\":1},{\"id\":" + squatA + ",\"orderIndex\":0}]}")
        .andExpect(status().isForbidden());
    perform(b, delete(exercises + "/" + benchA), null).andExpect(status().isForbidden());

    // The workout id in the path isn't what's checked, so B's own workout id doesn't help
    String ownPath = "/api/workouts/" + workoutB + "/exercises";
    perform(b, put(ownPath + "/" + benchA), "{\"sets\":9}").andExpect(status().isForbidden());
    perform(b, delete(ownPath + "/" + squatA), null).andExpect(status().isForbidden());
    // Reordering B's workout only touches B's exercises, so A's ids are ignored
    perform(b, patch(ownPath + "/reorder"),
        "{\"exercises\":[{\"id\":" + benchA + ",\"orderIndex\":5},{\"id\":" + squatA + ",\"orderIndex\":4}]}")
        .andExpect(status().isNoContent());

    perform(a, get(exercises), null)
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0].id").value(benchA))
        .andExpect(jsonPath("$[0].name").value("Bench"))
        .andExpect(jsonPath("$[0].description").value(nullValue()))
        .andExpect(jsonPath("$[0].sets").value(3))
        .andExpect(jsonPath("$[0].orderIndex").value(0))
        .andExpect(jsonPath("$[1].id").value(squatA))
        .andExpect(jsonPath("$[1].sets").value(4))
        .andExpect(jsonPath("$[1].orderIndex").value(1));
  }

  @Test
  void exerciseProgressOfOthersCannotBeRead() throws Exception {
    perform(b, get("/api/exercises/" + benchA + "/progress"), null).andExpect(status().isForbidden());
    perform(b, get("/api/library-exercises/" + libraryA + "/progress"), null).andExpect(status().isNotFound());
  }

  @Test
  void libraryEntriesOfOthersCannotBeLinked() throws Exception {
    perform(b, put("/api/workouts/" + workoutB + "/exercises/" + exerciseB), "{\"libraryExerciseId\":" + libraryA + "}")
        .andExpect(status().isNotFound());
    perform(b, post("/api/training-logs/" + sessionB + "/exercise-logs"),
        "{\"libraryExerciseId\":" + libraryA + ",\"addToWorkout\":true}")
        .andExpect(status().isNotFound());
    perform(b, put("/api/training-logs/exercise-logs/" + logB + "/replace"), "{\"libraryExerciseId\":" + libraryA + "}")
        .andExpect(status().isNotFound());

    perform(b, get("/api/workouts/" + workoutB + "/exercises"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value("Lunge"));
    perform(b, get("/api/training-logs/" + sessionB), null)
        .andExpect(jsonPath("$.exercises", hasSize(1)))
        .andExpect(jsonPath("$.exercises[0].exerciseName").value("Lunge"));
    perform(b, get("/api/library-exercises"), null)
        .andExpect(jsonPath("$[*].id", not(hasItem((int) libraryA))));
  }

  @Test
  void trainingLogsOfOthersCannotBeSeenOrChanged() throws Exception {
    perform(b, post("/api/training-logs/start"), "{\"workoutId\":" + workoutA + "}").andExpect(status().isForbidden());
    perform(b, get("/api/training-logs"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].id").value(sessionB));
    perform(b, get("/api/training-logs/active"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].id").value(sessionB));
    perform(b, get("/api/training-logs/" + completedSessionA), null).andExpect(status().isNotFound());
    perform(b, get("/api/training-logs/" + runningSessionA), null).andExpect(status().isNotFound());
    perform(b, put("/api/training-logs/" + runningSessionA + "/complete"), "{\"notes\":\"Taken\"}")
        .andExpect(status().isNotFound());
    perform(b, put("/api/training-logs/" + completedSessionA + "/review"), "{\"rating\":1,\"notes\":\"Taken\"}")
        .andExpect(status().isNotFound());
    perform(b, post("/api/training-logs/" + runningSessionA + "/exercise-logs"), "{\"name\":\"Planted\",\"addToWorkout\":true}")
        .andExpect(status().isNotFound());
    perform(b, put("/api/training-logs/exercise-logs/" + runningLogA), "{\"completed\":true,\"notes\":\"Taken\",\"sets\":[]}")
        .andExpect(status().isForbidden());
    perform(b, put("/api/training-logs/exercise-logs/" + runningLogA + "/replace"), "{\"name\":\"Planted\"}")
        .andExpect(status().isForbidden());
    perform(b, delete("/api/training-logs/exercise-logs/" + runningLogA), null).andExpect(status().isForbidden());
    perform(b, delete("/api/training-logs/" + runningSessionA), null).andExpect(status().isNotFound());
    perform(b, delete("/api/training-logs/" + completedSessionA), null).andExpect(status().isNotFound());

    perform(a, get("/api/training-logs/" + runningSessionA), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.isCompleted").value(false))
        .andExpect(jsonPath("$.exercises", hasSize(2)))
        .andExpect(jsonPath("$.exercises[0].id").value(runningLogA))
        .andExpect(jsonPath("$.exercises[0].exerciseName").value("Bench"))
        .andExpect(jsonPath("$.exercises[0].completed").value(false))
        .andExpect(jsonPath("$.exercises[0].notes").value("A's set"))
        .andExpect(jsonPath("$.exercises[0].sets", hasSize(1)))
        .andExpect(jsonPath("$.exercises[0].sets[0].weight").value(90.0));
    perform(a, get("/api/training-logs/" + completedSessionA), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.notes").value("A's notes"))
        .andExpect(jsonPath("$.rating").value(nullValue()));
    perform(a, get("/api/workouts/" + workoutA + "/exercises"), null)
        .andExpect(jsonPath("$", hasSize(2)));
  }

  @Test
  void statsOnlyCountOwnSessions() throws Exception {
    perform(b, get("/api/stats"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sessions.year").value(0))
        .andExpect(jsonPath("$.lastSession").value(nullValue()));
    perform(a, get("/api/stats"), null)
        .andExpect(jsonPath("$.sessions.year").value(1));
  }

  private long firstLogId(String token, long trainingLogId) throws Exception {
    String session = perform(token, get("/api/training-logs/" + trainingLogId), null)
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

  private ResultActions perform(String accessToken, MockHttpServletRequestBuilder request, String body) throws Exception {
    request.header("Authorization", "Bearer " + accessToken);
    if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
    return mockMvc.perform(request);
  }

  private static long id(ResultActions result) throws Exception {
    return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
  }
}
