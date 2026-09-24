package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StatsControllerTest {

  private static final String ZONE = "Europe/Berlin";

  @Autowired
  private MockMvc mockMvc;

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

  private String send(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
    return mockMvc.perform(request.header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().is2xxSuccessful())
        .andReturn().getResponse().getContentAsString();
  }

  private static long id(String json, String path) {
    return ((Number) JsonPath.read(json, path)).longValue();
  }

  @Test
  void aggregatesCompletedSessionsOnly() throws Exception {
    String token = register();
    long splitId = id(send(post("/api/splits"), token, "{\"name\":\"PPL\"}"), "$.id");
    long workoutId = id(send(post("/api/workouts/split/" + splitId), token, "{\"name\":\"Push\"}"), "$.id");
    send(post("/api/workouts/" + workoutId + "/exercises"), token,
        "{\"name\":\"Bench\",\"sets\":3,\"reps\":10,\"repUnit\":\"reps\"}");
    send(post("/api/workouts/" + workoutId + "/exercises"), token,
        "{\"name\":\"Plank\",\"sets\":3,\"reps\":60,\"repUnit\":\"seconds\"}");

    long trainingId = id(send(post("/api/training-logs/start"), token, "{\"workoutId\":" + workoutId + "}"), "$.id");
    String training = send(get("/api/training-logs/" + trainingId), token, "");
    List<Integer> benchIds = JsonPath.read(training, "$.exercises[?(@.exerciseName == 'Bench')].id");
    List<Integer> plankIds = JsonPath.read(training, "$.exercises[?(@.exerciseName == 'Plank')].id");

    // 3 × 10 × 50 kg = 1500 kg
    send(put("/api/training-logs/exercise-logs/" + benchIds.get(0)), token,
        "{\"setsCompleted\":3,\"repsCompleted\":10,\"weightUsed\":50,\"completed\":true}");
    // Timed exercise: must not count towards volume
    send(put("/api/training-logs/exercise-logs/" + plankIds.get(0)), token,
        "{\"setsCompleted\":3,\"repsCompleted\":60,\"weightUsed\":10,\"completed\":true}");
    send(put("/api/training-logs/" + trainingId + "/complete"), token, "{}");

    // An unfinished session is ignored
    send(post("/api/training-logs/start"), token, "{\"workoutId\":" + workoutId + "}");

    LocalDate today = LocalDate.now(ZoneId.of(ZONE));
    mockMvc.perform(get("/api/stats").param("tz", ZONE).header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sessions.week").value(1))
        .andExpect(jsonPath("$.sessions.year").value(1))
        .andExpect(jsonPath("$.volume.week").value(1500))
        .andExpect(jsonPath("$.volume.year").value(1500))
        .andExpect(jsonPath("$.averageVolume.month").value(1500))
        .andExpect(jsonPath("$.streak.current").value(1))
        .andExpect(jsonPath("$.streak.longest").value(1))
        .andExpect(jsonPath("$.streak.last7Days.length()").value(7))
        .andExpect(jsonPath("$.streak.last7Days[6].date").value(today.toString()))
        .andExpect(jsonPath("$.streak.last7Days[6].trained").value(true))
        .andExpect(jsonPath("$.mostActiveDay").value(today.getDayOfWeek().name()))
        .andExpect(jsonPath("$.mostActiveDaySessions").value(1))
        .andExpect(jsonPath("$.lastSession.id").value(trainingId))
        .andExpect(jsonPath("$.lastSession.workoutName").value("Push"))
        .andExpect(jsonPath("$.lastSession.exerciseCount").value(2));
  }

  @Test
  void emptyForNewUser() throws Exception {
    String token = register();
    mockMvc.perform(get("/api/stats").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sessions.year").value(0))
        .andExpect(jsonPath("$.volume.year").value(0))
        .andExpect(jsonPath("$.streak.current").value(0))
        .andExpect(jsonPath("$.mostActiveDay").isEmpty())
        .andExpect(jsonPath("$.lastSession").isEmpty());
  }

  @Test
  void rejectsOffsetTimeZone() throws Exception {
    String token = register();
    mockMvc.perform(get("/api/stats").param("tz", "+02:00").header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest());
  }

  @Test
  void requiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/stats")).andExpect(status().isUnauthorized());
  }
}
