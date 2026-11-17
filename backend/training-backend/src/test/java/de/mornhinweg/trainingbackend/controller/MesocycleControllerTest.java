package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import de.mornhinweg.trainingbackend.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class MesocycleControllerTest {

  // A fixed client date, so the tests don't depend on the server's
  private static final LocalDate TODAY = LocalDate.of(2026, 11, 17);

  @Autowired
  private MockMvc mockMvc;

  @Test
  void mesocycleIsOffUntilSetAndCanBeTurnedOff() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"PPL\"}")
        .andExpect(jsonPath("$.mesocycleWeeks").value(nullValue()))
        .andExpect(jsonPath("$.mesocycleStartDate").value(nullValue())));

    perform(token, put("/api/splits/" + splitId), """
        {"name":"PPL","mesocycleWeeks":5,"mesocycleStartDate":"2026-11-03"}
        """)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mesocycleWeeks").value(5))
        .andExpect(jsonPath("$.mesocycleStartDate").value("2026-11-03"));

    // Clients that don't send the fields (a rename, or the block) leave the cycle alone
    perform(token, put("/api/splits/" + splitId), "{\"name\":\"Renamed\",\"currentBlock\":2}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.currentBlock").value(2))
        .andExpect(jsonPath("$.mesocycleWeeks").value(5))
        .andExpect(jsonPath("$.mesocycleStartDate").value("2026-11-03"));

    // A new length keeps the start
    perform(token, put("/api/splits/" + splitId), "{\"name\":\"Renamed\",\"mesocycleWeeks\":6}")
        .andExpect(jsonPath("$.mesocycleWeeks").value(6))
        .andExpect(jsonPath("$.mesocycleStartDate").value("2026-11-03"));

    perform(token, put("/api/splits/" + splitId), "{\"name\":\"Renamed\",\"mesocycleWeeks\":0}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mesocycleWeeks").value(nullValue()))
        .andExpect(jsonPath("$.mesocycleStartDate").value(nullValue()));
  }

  @Test
  void turningItOnWithoutAStartStartsToday() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"PPL\"}"));

    perform(token, put("/api/splits/" + splitId), "{\"name\":\"PPL\",\"mesocycleWeeks\":4}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mesocycleStartDate").value(LocalDate.now().toString()));
  }

  @Test
  void invalidMesocyclesAreRejected() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"PPL\"}"));

    perform(token, put("/api/splits/" + splitId), "{\"name\":\"PPL\",\"mesocycleWeeks\":1}")
        .andExpect(status().isBadRequest());
    perform(token, put("/api/splits/" + splitId), "{\"name\":\"PPL\",\"mesocycleWeeks\":13}")
        .andExpect(status().isBadRequest());
    perform(token, put("/api/splits/" + splitId), "{\"name\":\"PPL\",\"mesocycleStartDate\":\"2026-11-03\"}")
        .andExpect(status().isBadRequest());
    perform(token, post("/api/splits/" + splitId + "/mesocycle/restart"), "{\"startDate\":\"2026-11-17\"}")
        .andExpect(status().isBadRequest());
    perform(token, put("/api/splits/" + splitId), "{\"name\":\"PPL\",\"currentBlock\":4}")
        .andExpect(status().isBadRequest());
  }

  @Test
  void restartMakesTheGivenDayWeekOne() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"PPL\"}"));
    perform(token, put("/api/splits/" + splitId), """
        {"name":"PPL","mesocycleWeeks":5,"mesocycleStartDate":"2026-10-01"}
        """).andExpect(status().isOk());

    perform(token, post("/api/splits/" + splitId + "/mesocycle/restart"), "{\"startDate\":\"2026-11-17\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mesocycleWeeks").value(5))
        .andExpect(jsonPath("$.mesocycleStartDate").value("2026-11-17"));

    // Without a date the server's today is used
    perform(token, post("/api/splits/" + splitId + "/mesocycle/restart"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mesocycleStartDate").value(LocalDate.now().toString()));
  }

  @Test
  void othersCannotChangeOrRestartTheCycle() throws Exception {
    String a = register();
    long splitA = id(perform(a, post("/api/splits"), "{\"name\":\"A split\"}"));
    perform(a, put("/api/splits/" + splitA), """
        {"name":"A split","mesocycleWeeks":5,"mesocycleStartDate":"2026-10-01"}
        """).andExpect(status().isOk());
    String b = register();

    perform(b, put("/api/splits/" + splitA), "{\"name\":\"Taken\",\"mesocycleWeeks\":0}")
        .andExpect(status().isNotFound());
    perform(b, post("/api/splits/" + splitA + "/mesocycle/restart"), "{\"startDate\":\"2026-11-17\"}")
        .andExpect(status().isNotFound());

    perform(a, get("/api/splits"), null)
        .andExpect(jsonPath("$[0].name").value("A split"))
        .andExpect(jsonPath("$[0].mesocycleWeeks").value(5))
        .andExpect(jsonPath("$[0].mesocycleStartDate").value("2026-10-01"));
  }

  @Test
  void sessionsOutsideTheDeloadWeekKeepThePlan() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"PPL\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    perform(token, post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Bench\",\"sets\":5,\"reps\":8,\"plannedWeight\":100}")
        .andExpect(status().isCreated());
    // Week 4 of 5
    setCycle(token, splitId, 5, TODAY.minusWeeks(3));

    start(token, workoutId, TODAY)
        .andExpect(jsonPath("$.deload").value(false))
        .andExpect(jsonPath("$.exercises[0].plannedSets").value(5))
        .andExpect(jsonPath("$.exercises[0].plannedWeight").value(100.0));

    // No mesocycle at all
    setCycle(token, splitId, 0, null);
    start(token, workoutId, TODAY).andExpect(jsonPath("$.deload").value(false));
  }

  @Test
  void deloadSessionsLowerTheTargetsAndStayOutOfThePreviousValues() throws Exception {
    String token = register();
    long splitId = id(perform(token, post("/api/splits"), "{\"name\":\"PPL\"}"));
    long workoutId = id(perform(token, post("/api/workouts/split/" + splitId), "{\"name\":\"Push\"}"));
    perform(token, post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Bench\",\"sets\":5,\"reps\":8,\"plannedWeight\":100}")
        .andExpect(status().isCreated());
    // No planned weight or sets: the deload works from the last regular session
    String row = perform(token, post("/api/workouts/" + workoutId + "/exercises"), "{\"name\":\"Row\",\"reps\":10}")
        .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
    long rowLibraryId = ((Number) JsonPath.read(row, "$.libraryExerciseId")).longValue();

    // A regular session first
    String regular = start(token, workoutId, TODAY).andReturn().getResponse().getContentAsString();
    long regularId = ((Number) JsonPath.read(regular, "$.id")).longValue();
    logSets(token, JsonPath.read(regular, "$.exercises[1].id"), "[{\"reps\":10,\"weight\":60},{\"reps\":10,\"weight\":60},{\"reps\":10,\"weight\":60}]");
    perform(token, put("/api/training-logs/" + regularId + "/complete"), "{}").andExpect(status().isOk());

    // The client's date falls in week 5 of 5
    setCycle(token, splitId, 5, TODAY.minusWeeks(4));
    String deload = start(token, workoutId, TODAY)
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.deload").value(true))
        // Bench: half the sets rounded up, 90% of the planned weight, same reps
        .andExpect(jsonPath("$.exercises[0].plannedSets").value(3))
        .andExpect(jsonPath("$.exercises[0].plannedReps").value(8))
        .andExpect(jsonPath("$.exercises[0].plannedWeight").value(90.0))
        // Row: from the last regular session (3 × 10 @ 60)
        .andExpect(jsonPath("$.exercises[1].plannedSets").value(2))
        .andExpect(jsonPath("$.exercises[1].plannedReps").value(10))
        .andExpect(jsonPath("$.exercises[1].plannedWeight").value(54.0))
        // So that clients prefill the deload targets rather than the last session
        .andExpect(jsonPath("$.exercises[1].previousSets").value(nullValue()))
        .andExpect(jsonPath("$.exercises[1].previousSetLogs").value(nullValue()))
        .andExpect(jsonPath("$.exercises[1].earlierSetLogs").value(nullValue()))
        .andReturn().getResponse().getContentAsString();
    long deloadId = ((Number) JsonPath.read(deload, "$.id")).longValue();

    perform(token, get("/api/training-logs/" + deloadId), null)
        .andExpect(jsonPath("$.deload").value(true))
        .andExpect(jsonPath("$.exercises[0].plannedWeight").value(90.0));

    logSets(token, JsonPath.read(deload, "$.exercises[1].id"), "[{\"reps\":10,\"weight\":54},{\"reps\":10,\"weight\":54}]");
    perform(token, put("/api/training-logs/" + deloadId + "/complete"), "{}").andExpect(status().isOk());

    perform(token, get("/api/training-logs"), null)
        .andExpect(jsonPath("$[0].id").value(deloadId))
        .andExpect(jsonPath("$[0].deload").value(true))
        .andExpect(jsonPath("$[1].deload").value(false));
    perform(token, get("/api/library-exercises/" + rowLibraryId + "/progress"), null)
        .andExpect(jsonPath("$.entries[0].deload").value(false))
        .andExpect(jsonPath("$.entries[1].deload").value(true));

    // The next regular session starts from the last regular one, not the deload
    setCycle(token, splitId, 5, TODAY);
    String next = start(token, workoutId, TODAY)
        .andExpect(jsonPath("$.deload").value(false))
        .andExpect(jsonPath("$.exercises[1].previousSets").value(3))
        .andExpect(jsonPath("$.exercises[1].previousWeight").value(60.0))
        .andReturn().getResponse().getContentAsString();
    assertEquals(60.0, ((Number) JsonPath.read(next, "$.exercises[1].weightUsed")).doubleValue());
  }

  private void setCycle(String token, long splitId, int weeks, LocalDate start) throws Exception {
    String body = start != null
        ? "{\"name\":\"PPL\",\"mesocycleWeeks\":%d,\"mesocycleStartDate\":\"%s\"}".formatted(weeks, start)
        : "{\"name\":\"PPL\",\"mesocycleWeeks\":%d}".formatted(weeks);
    perform(token, put("/api/splits/" + splitId), body).andExpect(status().isOk());
  }

  private ResultActions start(String token, long workoutId, LocalDate localDate) throws Exception {
    return perform(token, post("/api/training-logs/start"),
        "{\"workoutId\":%d,\"localDate\":\"%s\"}".formatted(workoutId, localDate))
        .andExpect(status().isCreated());
  }

  private void logSets(String token, Number exerciseLogId, String sets) throws Exception {
    perform(token, put("/api/training-logs/exercise-logs/" + exerciseLogId), "{\"completed\":true,\"sets\":" + sets + "}")
        .andExpect(status().isOk());
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

  private long id(ResultActions result) throws Exception {
    return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
  }
}
