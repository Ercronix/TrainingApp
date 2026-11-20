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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Supersets and circuits: exercises of a workout grouped to be done back to back. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class SupersetControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private String token;
  private long workoutId;
  private String exercises;

  @BeforeEach
  void setUp() throws Exception {
    token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"Split\"}"));
    workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    exercises = "/api/workouts/" + workoutId + "/exercises";
  }

  @Test
  void exercisesCanBeSupersetAndGrownIntoACircuit() throws Exception {
    long bench = create("Bench");
    long row = create("Row");
    create("Curl");
    create("Plank");

    perform(token, post(exercises + "/" + bench + "/superset"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].supersetGroup").value(1))
        .andExpect(jsonPath("$[1].supersetGroup").value(1))
        .andExpect(jsonPath("$[2].supersetGroup").value(nullValue()));
    assertThat(groups()).containsExactly("Bench:1", "Row:1", "Curl:-", "Plank:-");

    // From the last member, the next one joins: a circuit of three
    perform(token, post(exercises + "/" + row + "/superset"), null).andExpect(status().isOk());
    assertThat(groups()).containsExactly("Bench:1", "Row:1", "Curl:1", "Plank:-");

    // Linking again inside the group changes nothing
    perform(token, post(exercises + "/" + bench + "/superset"), null).andExpect(status().isOk());
    assertThat(groups()).containsExactly("Bench:1", "Row:1", "Curl:1", "Plank:-");

    // The last exercise has nothing to superset with
    long plank = idOf("Plank");
    perform(token, post(exercises + "/" + plank + "/superset"), null).andExpect(status().isBadRequest());
  }

  @Test
  void supersettingIntoTheNextGroupMergesThem() throws Exception {
    long bench = create("Bench");
    long row = create("Row");
    long curl = create("Curl");
    create("Pushdown");
    create("Plank");
    perform(token, post(exercises + "/" + bench + "/superset"), null).andExpect(status().isOk());
    perform(token, post(exercises + "/" + curl + "/superset"), null).andExpect(status().isOk());
    assertThat(groups()).containsExactly("Bench:1", "Row:1", "Curl:2", "Pushdown:2", "Plank:-");

    perform(token, post(exercises + "/" + row + "/superset"), null).andExpect(status().isOk());
    assertThat(groups()).containsExactly("Bench:1", "Row:1", "Curl:1", "Pushdown:1", "Plank:-");

    // An ungrouped exercise joins the group after it
    long plank = idOf("Plank");
    reorder(plank, bench, row, curl, idOf("Pushdown"));
    perform(token, post(exercises + "/" + plank + "/superset"), null).andExpect(status().isOk());
    assertThat(groups()).containsExactly("Plank:1", "Bench:1", "Row:1", "Curl:1", "Pushdown:1");
  }

  @Test
  void removingFromTheMiddleSplitsTheGroup() throws Exception {
    long a = create("A");
    long b = create("B");
    long c = create("C");
    long d = create("D");
    long e = create("E");
    perform(token, post(exercises + "/" + a + "/superset"), null);
    perform(token, post(exercises + "/" + b + "/superset"), null);
    perform(token, post(exercises + "/" + c + "/superset"), null);
    perform(token, post(exercises + "/" + d + "/superset"), null);
    assertThat(groups()).containsExactly("A:1", "B:1", "C:1", "D:1", "E:1");

    // A on its own before, D and E after: only the two after stay a superset
    perform(token, delete(exercises + "/" + b + "/superset"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[1].supersetGroup").value(nullValue()));
    assertThat(groups()).containsExactly("A:-", "B:-", "C:1", "D:1", "E:1");

    perform(token, delete(exercises + "/" + d + "/superset"), null).andExpect(status().isOk());
    assertThat(groups()).containsExactly("A:-", "B:-", "C:-", "D:-", "E:-");

    // Removing an exercise that isn't in a superset is fine
    perform(token, delete(exercises + "/" + a + "/superset"), null).andExpect(status().isOk());
    assertNoBrokenGroups();
  }

  @Test
  void reorderingKeepsGroupsAdjacent() throws Exception {
    long a = create("A");
    long b = create("B");
    long c = create("C");
    long d = create("D");
    perform(token, post(exercises + "/" + a + "/superset"), null);
    perform(token, post(exercises + "/" + b + "/superset"), null);
    assertThat(groups()).containsExactly("A:1", "B:1", "C:1", "D:-");

    // Moving the whole group keeps it
    reorder(d, a, b, c);
    assertThat(groups()).containsExactly("D:-", "A:1", "B:1", "C:1");

    // An exercise dropped into the circuit splits it: A is left alone, B and C stay together
    reorder(a, d, b, c);
    assertThat(groups()).containsExactly("A:-", "D:-", "B:1", "C:1");
    assertNoBrokenGroups();

    // Moving a member away leaves its partner alone, so neither is grouped
    reorder(b, a, d, c);
    assertThat(groups()).containsExactly("B:-", "A:-", "D:-", "C:-");
    assertNoBrokenGroups();
  }

  @Test
  void updatingTheOrderOfOneExerciseKeepsGroupsAdjacent() throws Exception {
    long a = create("A");
    create("B");
    create("C");
    perform(token, post(exercises + "/" + a + "/superset"), null);

    perform(token, put(exercises + "/" + a), "{\"orderIndex\":5}").andExpect(status().isOk());
    assertThat(groups()).containsExactly("B:-", "C:-", "A:-");
  }

  @Test
  void deletingAnExerciseCleansUpItsGroup() throws Exception {
    long a = create("A");
    long b = create("B");
    create("C");
    long d = create("D");
    long e = create("E");
    perform(token, post(exercises + "/" + a + "/superset"), null);
    perform(token, post(exercises + "/" + b + "/superset"), null);
    perform(token, post(exercises + "/" + d + "/superset"), null);
    assertThat(groups()).containsExactly("A:1", "B:1", "C:1", "D:2", "E:2");

    // The members left are still next to each other: a superset of two
    perform(token, delete(exercises + "/" + b), null).andExpect(status().isNoContent());
    assertThat(groups()).containsExactly("A:1", "C:1", "D:2", "E:2");

    // A superset losing a member leaves one exercise, which is no group
    perform(token, delete(exercises + "/" + e), null).andExpect(status().isNoContent());
    assertThat(groups()).containsExactly("A:1", "C:1", "D:-");
    perform(token, delete(exercises + "/" + a), null).andExpect(status().isNoContent());
    assertThat(groups()).containsExactly("C:-", "D:-");

    // New exercises go after the others, also when an order index was left free
    create("F");
    assertThat(orderIndexes()).containsExactly(0, 1, 2);
  }

  @Test
  void sessionLogsCarryTheGroupAndAddedExercisesAreNeverGrouped() throws Exception {
    long bench = create("Bench");
    create("Row");
    create("Curl");
    perform(token, post(exercises + "/" + bench + "/superset"), null);

    long sessionId = id(perform(token, post("/api/training-logs/start"), "{\"workoutId\":" + workoutId + "}"));
    perform(token, get("/api/training-logs/" + sessionId), null)
        .andExpect(jsonPath("$.exercises[0].exerciseName").value("Bench"))
        .andExpect(jsonPath("$.exercises[0].supersetGroup").value(1))
        .andExpect(jsonPath("$.exercises[1].supersetGroup").value(1))
        .andExpect(jsonPath("$.exercises[2].supersetGroup").value(nullValue()));

    String added = perform(token, post("/api/training-logs/" + sessionId + "/exercise-logs"), "{\"name\":\"Dips\",\"sets\":3,\"reps\":8,\"addToWorkout\":false}")
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.supersetGroup").value(nullValue()))
        .andReturn().getResponse().getContentAsString();
    long temporaryId = ((Number) JsonPath.read(added, "$.exerciseId")).longValue();
    perform(token, post(exercises + "/" + temporaryId + "/superset"), null).andExpect(status().isBadRequest());
    assertThat(groups()).containsExactly("Bench:1", "Row:1", "Curl:-");
  }

  @Test
  void supersetsOfOthersCannotBeChanged() throws Exception {
    long bench = create("Bench");
    long row = create("Row");
    perform(token, post(exercises + "/" + bench + "/superset"), null).andExpect(status().isOk());

    String other = register();
    long otherSplit = id(perform(other, post("/api/splits"), "{\"name\":\"Other\"}"));
    long otherWorkout = id(perform(other, post("/api/workouts/split/" + otherSplit), "{\"name\":\"Legs\"}"));
    String otherExercises = "/api/workouts/" + otherWorkout + "/exercises";
    long lunge = id(perform(other, post(otherExercises), "{\"name\":\"Lunge\"}"));
    perform(other, post(otherExercises), "{\"name\":\"Squat\"}").andExpect(status().isCreated());

    perform(other, post(exercises + "/" + row + "/superset"), null).andExpect(status().isForbidden());
    perform(other, delete(exercises + "/" + bench + "/superset"), null).andExpect(status().isForbidden());
    // Their own workout in the path doesn't help
    perform(other, delete(otherExercises + "/" + bench + "/superset"), null).andExpect(status().isForbidden());
    // Nor does pointing at someone else's workout with their own exercise
    perform(other, post(exercises + "/" + lunge + "/superset"), null).andExpect(status().isNotFound());
    perform(token, post(otherExercises + "/" + lunge + "/superset"), null).andExpect(status().isForbidden());

    assertThat(groups()).containsExactly("Bench:1", "Row:1");
    String theirs = perform(other, get(otherExercises), null).andReturn().getResponse().getContentAsString();
    List<Object> theirGroups = JsonPath.read(theirs, "$[*].supersetGroup");
    assertThat(theirGroups).containsOnlyNulls();
  }

  // ---- helpers ----

  /** The workout's exercises in order as "name:group", "-" for none. */
  private List<String> groups() throws Exception {
    List<Map<String, Object>> list = list();
    List<String> result = new ArrayList<>();
    for (Map<String, Object> e : list) {
      Object group = e.get("supersetGroup");
      result.add(e.get("name") + ":" + (group == null ? "-" : group));
    }
    return result;
  }

  private List<Integer> orderIndexes() throws Exception {
    return list().stream().map(e -> ((Number) e.get("orderIndex")).intValue()).toList();
  }

  /** Every group is one run of two or more adjacent exercises. */
  private void assertNoBrokenGroups() throws Exception {
    List<Object> groups = list().stream().map(e -> e.get("supersetGroup")).toList();
    Map<Object, Integer> sizes = new HashMap<>();
    Set<Object> closed = new HashSet<>();
    Object previous = null;
    for (Object group : groups) {
      if (group != null) {
        if (!group.equals(previous)) assertThat(closed.add(group)).as("group %s is split", group).isTrue();
        sizes.merge(group, 1, Integer::sum);
      }
      previous = group;
    }
    sizes.forEach((group, size) -> assertThat(size).as("size of group %s", group).isGreaterThan(1));
  }

  private List<Map<String, Object>> list() throws Exception {
    String body = perform(token, get(exercises), null).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    return JsonPath.read(body, "$");
  }

  private long idOf(String name) throws Exception {
    return list().stream()
        .filter(e -> Objects.equals(e.get("name"), name))
        .map(e -> ((Number) e.get("id")).longValue())
        .findFirst().orElseThrow();
  }

  private void reorder(long... ids) throws Exception {
    String items = IntStream.range(0, ids.length)
        .mapToObj(i -> "{\"id\":" + ids[i] + ",\"orderIndex\":" + i + "}")
        .collect(Collectors.joining(","));
    perform(token, patch(exercises + "/reorder"), "{\"exercises\":[" + items + "]}").andExpect(status().isNoContent());
  }

  private long create(String name) throws Exception {
    return id(perform(token, post(exercises), "{\"name\":\"" + name + "\",\"sets\":3,\"reps\":10}").andExpect(status().isCreated()));
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

  private ResultActions perform(String auth, MockHttpServletRequestBuilder request, String body) throws Exception {
    request.header("Authorization", "Bearer " + auth);
    if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
    return mockMvc.perform(request);
  }

  private static long id(ResultActions result) throws Exception {
    return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
  }
}
