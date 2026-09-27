package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ExerciseCatalogControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void catalogListsExercisesWithSplitDelts() throws Exception {
    String catalog = mockMvc.perform(get("/api/exercise-catalog").header("Authorization", "Bearer " + register()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(greaterThan(700))))
        .andReturn().getResponse().getContentAsString();

    assertMuscles(catalog, "Side Lateral Raise", "SIDE_DELTS", "PRIMARY");
    assertMuscles(catalog, "Face Pull", "REAR_DELTS", "PRIMARY");
    assertMuscles(catalog, "Barbell Bench Press - Medium Grip", "FRONT_DELTS", "SECONDARY");
    assertMuscles(catalog, "Bent Over Barbell Row", "REAR_DELTS", "SECONDARY");

    List<String> muscles = JsonPath.read(catalog, "$[*].muscles[*].muscle");
    assertTrue(muscles.stream().noneMatch("SHOULDERS"::equals));
  }

  @Test
  void catalogRequiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/exercise-catalog"))
        .andExpect(status().is(anyOf(is(401), is(403))));
  }

  private static void assertMuscles(String catalog, String name, String muscle, String role) {
    List<String> roles = JsonPath.read(catalog,
        "$[?(@.name == '" + name + "')].muscles[?(@.muscle == '" + muscle + "')].role");
    assertTrue(roles.contains(role), name + " should train " + muscle + " as " + role + " but has " + roles);
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
}
