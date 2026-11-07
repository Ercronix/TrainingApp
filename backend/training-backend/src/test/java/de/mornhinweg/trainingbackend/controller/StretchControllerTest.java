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

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StretchControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private String token;

  @BeforeEach
  void setUp() throws Exception {
    token = register();
  }

  @Test
  void aNewUserGetsAnEmptyRoutine() throws Exception {
    perform(token, get("/api/stretch/routine"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Daily stretch"))
        .andExpect(jsonPath("$.items", hasSize(0)));
  }

  @Test
  void itemsAreAddedInOrderAndCanBeReordered() throws Exception {
    long hip = addItem("{\"name\":\" Hip flexor \",\"kind\":\"hold\",\"amount\":30,\"perSide\":true}");
    long catCow = addItem("{\"name\":\"Cat-cow\",\"kind\":\"reps\",\"amount\":10}");

    perform(token, get("/api/stretch/routine"), null)
        .andExpect(jsonPath("$.items", hasSize(2)))
        .andExpect(jsonPath("$.items[0].name").value("Hip flexor"))
        .andExpect(jsonPath("$.items[0].perSide").value(true))
        .andExpect(jsonPath("$.items[1].kind").value("reps"))
        .andExpect(jsonPath("$.items[1].perSide").value(false));

    perform(token, patch("/api/stretch/items/reorder"),
        "{\"items\":[{\"id\":" + hip + ",\"orderIndex\":1},{\"id\":" + catCow + ",\"orderIndex\":0}]}")
        .andExpect(status().isNoContent());

    perform(token, get("/api/stretch/routine"), null)
        .andExpect(jsonPath("$.items[0].name").value("Cat-cow"))
        .andExpect(jsonPath("$.items[1].name").value("Hip flexor"));
  }

  @Test
  void itemsCanBeUpdatedAndDeleted() throws Exception {
    long id = addItem("{\"name\":\"Pigeon\",\"kind\":\"hold\",\"amount\":45,\"note\":\"Square hips\"}");

    perform(token, put("/api/stretch/items/" + id), "{\"amount\":60,\"perSide\":true,\"note\":\"\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Pigeon"))
        .andExpect(jsonPath("$.amount").value(60))
        .andExpect(jsonPath("$.perSide").value(true))
        .andExpect(jsonPath("$.note").doesNotExist());

    perform(token, delete("/api/stretch/items/" + id), null).andExpect(status().isNoContent());
    perform(token, get("/api/stretch/routine"), null).andExpect(jsonPath("$.items", hasSize(0)));
  }

  @Test
  void invalidItemsAreRejected() throws Exception {
    perform(token, post("/api/stretch/items"), "{\"name\":\"X\",\"kind\":\"sprint\",\"amount\":10}")
        .andExpect(status().isBadRequest());
    perform(token, post("/api/stretch/items"), "{\"name\":\"X\",\"kind\":\"hold\",\"amount\":0}")
        .andExpect(status().isBadRequest());
    perform(token, post("/api/stretch/items"), "{\"name\":\" \",\"kind\":\"hold\",\"amount\":10}")
        .andExpect(status().isBadRequest());
    perform(token, post("/api/stretch/items"), "{\"name\":\"X\"}")
        .andExpect(status().isBadRequest());
  }

  @Test
  void routineCanBeRenamed() throws Exception {
    perform(token, put("/api/stretch/routine"), "{\"name\":\"Evening stretch\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Evening stretch"));
  }

  @Test
  void checkInsAreIdempotentAndCanBeUndone() throws Exception {
    LocalDate today = LocalDate.now();
    LocalDate yesterday = today.minusDays(1);

    perform(token, put("/api/stretch/check-ins/" + today), null).andExpect(status().isNoContent());
    perform(token, put("/api/stretch/check-ins/" + today), null).andExpect(status().isNoContent());
    perform(token, put("/api/stretch/check-ins/" + yesterday), null).andExpect(status().isNoContent());

    perform(token, get("/api/stretch/check-ins"), null)
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0]").value(yesterday.toString()))
        .andExpect(jsonPath("$[1]").value(today.toString()));

    perform(token, delete("/api/stretch/check-ins/" + today), null).andExpect(status().isNoContent());
    perform(token, get("/api/stretch/check-ins"), null).andExpect(jsonPath("$", hasSize(1)));
  }

  @Test
  void farFutureCheckInsAreRejected() throws Exception {
    perform(token, put("/api/stretch/check-ins/" + LocalDate.now().plusDays(5)), null)
        .andExpect(status().isBadRequest());
  }

  @Test
  void usersCannotTouchEachOthersStretches() throws Exception {
    long id = addItem("{\"name\":\"Calf stretch\",\"kind\":\"hold\",\"amount\":30}");
    perform(token, put("/api/stretch/check-ins/" + LocalDate.now()), null).andExpect(status().isNoContent());
    String other = register();

    perform(other, put("/api/stretch/items/" + id), "{\"amount\":5}").andExpect(status().isNotFound());
    perform(other, delete("/api/stretch/items/" + id), null).andExpect(status().isNotFound());
    perform(other, patch("/api/stretch/items/reorder"), "{\"items\":[{\"id\":" + id + ",\"orderIndex\":7}]}")
        .andExpect(status().isNoContent());
    perform(other, get("/api/stretch/check-ins"), null).andExpect(jsonPath("$", hasSize(0)));

    perform(token, get("/api/stretch/routine"), null)
        .andExpect(jsonPath("$.items[0].amount").value(30))
        .andExpect(jsonPath("$.items[0].orderIndex").value(0));
  }

  private long addItem(String body) throws Exception {
    String response = perform(token, post("/api/stretch/items"), body)
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    return ((Number) JsonPath.read(response, "$.id")).longValue();
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
}
