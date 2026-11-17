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

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
class BodyWeightControllerTest {

  private static final LocalDate TODAY = LocalDate.now();

  @Autowired
  private MockMvc mockMvc;

  private String token;

  @BeforeEach
  void setUp() throws Exception {
    token = register();
  }

  @Test
  void aNewUserHasNoEntries() throws Exception {
    perform(token, get("/api/body-weight"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  void entriesAreListedInDateOrder() throws Exception {
    upsert(TODAY, "{\"weight\":80.4}").andExpect(status().isOk());
    upsert(TODAY.minusDays(2), "{\"weight\":81.25,\"note\":\" after holiday \"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.date").value(TODAY.minusDays(2).toString()))
        .andExpect(jsonPath("$.weight").value(81.25))
        .andExpect(jsonPath("$.note").value("after holiday"));
    upsert(TODAY.minusDays(1), "{\"weight\":80.9}").andExpect(status().isOk());

    perform(token, get("/api/body-weight"), null)
        .andExpect(jsonPath("$", hasSize(3)))
        .andExpect(jsonPath("$[0].date").value(TODAY.minusDays(2).toString()))
        .andExpect(jsonPath("$[1].date").value(TODAY.minusDays(1).toString()))
        .andExpect(jsonPath("$[2].date").value(TODAY.toString()))
        .andExpect(jsonPath("$[2].weight").value(80.4));
  }

  @Test
  void settingADayAgainReplacesItsEntry() throws Exception {
    long id = id(upsert(TODAY, "{\"weight\":80,\"note\":\"morning\"}").andExpect(status().isOk()));

    upsert(TODAY, "{\"weight\":79.6}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.weight").value(79.6))
        .andExpect(jsonPath("$.note").doesNotExist());

    String list = perform(token, get("/api/body-weight"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].weight").value(79.6))
        .andReturn().getResponse().getContentAsString();
    // Replaced in place, not deleted and recreated
    assertThat(((Number) JsonPath.read(list, "$[0].id")).longValue()).isEqualTo(id);
  }

  @Test
  void theListCanBeLimitedToADateRange() throws Exception {
    for (int daysAgo = 0; daysAgo < 5; daysAgo++) {
      upsert(TODAY.minusDays(daysAgo), "{\"weight\":" + (80 + daysAgo) + "}").andExpect(status().isOk());
    }

    perform(token, get("/api/body-weight?from=" + TODAY.minusDays(3) + "&to=" + TODAY.minusDays(1)), null)
        .andExpect(jsonPath("$", hasSize(3)))
        .andExpect(jsonPath("$[0].weight").value(83))
        .andExpect(jsonPath("$[2].weight").value(81));
    perform(token, get("/api/body-weight?from=" + TODAY.minusDays(1)), null)
        .andExpect(jsonPath("$", hasSize(2)));
    perform(token, get("/api/body-weight?to=" + TODAY.minusDays(4)), null)
        .andExpect(jsonPath("$", hasSize(1)));
    perform(token, get("/api/body-weight?from=" + TODAY + "&to=" + TODAY.minusDays(1)), null)
        .andExpect(status().isBadRequest());
  }

  @Test
  void entriesCanBeDeletedIdempotently() throws Exception {
    upsert(TODAY, "{\"weight\":80}").andExpect(status().isOk());
    upsert(TODAY.minusDays(1), "{\"weight\":81}").andExpect(status().isOk());

    perform(token, delete("/api/body-weight/" + TODAY), null).andExpect(status().isNoContent());
    perform(token, delete("/api/body-weight/" + TODAY), null).andExpect(status().isNoContent());

    perform(token, get("/api/body-weight"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].date").value(TODAY.minusDays(1).toString()));
  }

  @Test
  void invalidEntriesAreRejected() throws Exception {
    upsert(TODAY, "{}").andExpect(status().isBadRequest());
    upsert(TODAY, "{\"weight\":0}").andExpect(status().isBadRequest());
    upsert(TODAY, "{\"weight\":-70}").andExpect(status().isBadRequest());
    upsert(TODAY, "{\"weight\":1000}").andExpect(status().isBadRequest());
    upsert(TODAY, "{\"weight\":80.125}").andExpect(status().isBadRequest());
    upsert(TODAY.plusDays(5), "{\"weight\":80}").andExpect(status().isBadRequest());
    perform(token, put("/api/body-weight/not-a-date"), "{\"weight\":80}").andExpect(status().isBadRequest());
  }

  @Test
  void usersCannotSeeOrTouchEachOthersEntries() throws Exception {
    upsert(TODAY, "{\"weight\":80,\"note\":\"mine\"}").andExpect(status().isOk());
    String other = register();

    perform(other, get("/api/body-weight"), null).andExpect(jsonPath("$", hasSize(0)));
    // The same day for another user is that user's own entry, not this one
    perform(other, put("/api/body-weight/" + TODAY), "{\"weight\":60}").andExpect(status().isOk());
    perform(other, delete("/api/body-weight/" + TODAY), null).andExpect(status().isNoContent());

    perform(token, get("/api/body-weight"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].weight").value(80))
        .andExpect(jsonPath("$[0].note").value("mine"));
    perform(other, get("/api/body-weight"), null).andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  void requiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/body-weight")).andExpect(status().isUnauthorized());
  }

  private ResultActions upsert(LocalDate day, String body) throws Exception {
    return perform(token, put("/api/body-weight/" + day), body);
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
