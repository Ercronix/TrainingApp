package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class ApiDocsTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void specIsPublicAndCoversTheApi() throws Exception {
    mockMvc.perform(get("/api/docs/openapi.json"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.openapi").exists())
        .andExpect(jsonPath("$.info.title").value("TrainingApp API"))
        // Paths across domains
        .andExpect(jsonPath("$.paths['/api/auth/login'].post").exists())
        .andExpect(jsonPath("$.paths['/api/splits'].get").exists())
        .andExpect(jsonPath("$.paths['/api/workouts/{workoutId}/exercises'].post").exists())
        .andExpect(jsonPath("$.paths['/api/library-exercises'].get").exists())
        .andExpect(jsonPath("$.paths['/api/exercise-catalog/{id}/illustrations/{index}'].get").exists())
        .andExpect(jsonPath("$.paths['/api/training-logs/start'].post").exists())
        .andExpect(jsonPath("$.paths['/api/stats'].get").exists())
        .andExpect(jsonPath("$.paths['/api/stretch/routine'].get").exists())
        .andExpect(jsonPath("$.paths['/api/account'].put").exists())
        // Grouped by domain
        .andExpect(jsonPath("$.paths['/api/splits'].get.tags", hasItem("Splits")))
        .andExpect(jsonPath("$.tags[*].name", hasItem("Stretch")))
        // Bearer JWT required globally, except for the public endpoints
        .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.type").value("http"))
        .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"))
        .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.bearerFormat").value("JWT"))
        .andExpect(jsonPath("$.security[0].bearerAuth").exists())
        .andExpect(jsonPath("$.paths['/api/auth/login'].post.security", empty()))
        .andExpect(jsonPath("$.paths['/api/stretch/reminder/done/{token}'].post.security", empty()))
        .andExpect(jsonPath("$.paths['/api/auth/me'].get.security").doesNotExist())
        // Not documented as request parameters: they come from the token
        .andExpect(jsonPath("$.paths['/api/splits'].get.parameters").doesNotExist());
  }

  @Test
  void swaggerUiIsPublic() throws Exception {
    mockMvc.perform(get("/api/docs"))
        .andExpect(status().is3xxRedirection())
        .andExpect(header().string("Location", containsString("/api/swagger-ui/index.html")));

    mockMvc.perform(get("/api/swagger-ui/index.html"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("swagger-ui")));

    // The UI loads its config from here, which points it at the spec
    mockMvc.perform(get("/api/docs/openapi.json/swagger-config"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.url").value("/api/docs/openapi.json"));
  }

  @Test
  void restOfTheApiStillNeedsAToken() throws Exception {
    mockMvc.perform(get("/api/splits")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/api/exercise-catalog")).andExpect(status().isUnauthorized());
  }
}
