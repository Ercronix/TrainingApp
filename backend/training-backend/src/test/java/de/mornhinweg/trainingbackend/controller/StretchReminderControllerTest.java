package de.mornhinweg.trainingbackend.controller;

import com.jayway.jsonpath.JsonPath;
import de.mornhinweg.trainingbackend.model.StretchReminder;
import de.mornhinweg.trainingbackend.notification.NtfyClient;
import de.mornhinweg.trainingbackend.repository.StretchReminderRepository;
import de.mornhinweg.trainingbackend.service.StretchReminderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.public-url=https://training.example.com/")
@AutoConfigureMockMvc
class StretchReminderControllerTest {

  // 08:30 in Berlin
  private static final Instant MORNING = Instant.parse("2026-01-05T07:30:00Z");
  private static final LocalDate MORNING_DAY = LocalDate.of(2026, 1, 5);

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private StretchReminderRepository reminderRepository;

  @Autowired
  private StretchReminderService reminderService;

  @MockitoBean
  private NtfyClient ntfy;

  private String token;
  private long userId;

  @BeforeEach
  void setUp() throws Exception {
    when(ntfy.isConfigured()).thenReturn(true);
    when(ntfy.topicUrl(any())).thenAnswer(i -> "https://ntfy.example.com/" + i.getArgument(0));
    String response = register();
    token = JsonPath.read(response, "$.token");
    userId = ((Number) JsonPath.read(response, "$.userId")).longValue();
  }

  @Test
  void aNewReminderIsOffWithItsOwnTopic() throws Exception {
    perform(token, get("/api/stretch/reminder"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(false))
        .andExpect(jsonPath("$.time").value("08:00"))
        .andExpect(jsonPath("$.available").value(true))
        .andExpect(jsonPath("$.doneButton").value(true))
        .andExpect(jsonPath("$.topic").value(startsWith("stretch-")))
        .andExpect(jsonPath("$.topicUrl").value(startsWith("https://ntfy.example.com/stretch-")));
  }

  @Test
  void theReminderCanBeTurnedOnWithATimeAndZone() throws Exception {
    perform(token, put("/api/stretch/reminder"), "{\"enabled\":true,\"time\":\"20:15\",\"timeZone\":\"Europe/Berlin\"}")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(true))
        .andExpect(jsonPath("$.time").value("20:15"))
        .andExpect(jsonPath("$.timeZone").value("Europe/Berlin"));
  }

  @Test
  void invalidSettingsAreRejected() throws Exception {
    perform(token, put("/api/stretch/reminder"), "{\"enabled\":true,\"time\":\"25:00\",\"timeZone\":\"Europe/Berlin\"}")
        .andExpect(status().isBadRequest());
    perform(token, put("/api/stretch/reminder"), "{\"enabled\":true,\"time\":\"08:00\",\"timeZone\":\"Mars/Olympus\"}")
        .andExpect(status().isBadRequest());
  }

  @Test
  void remindersCantBeTurnedOnWithoutAnNtfyServer() throws Exception {
    when(ntfy.isConfigured()).thenReturn(false);
    perform(token, put("/api/stretch/reminder"), "{\"enabled\":true,\"time\":\"08:00\",\"timeZone\":\"UTC\"}")
        .andExpect(status().isBadRequest());
    perform(token, get("/api/stretch/reminder"), null)
        .andExpect(jsonPath("$.available").value(false))
        .andExpect(jsonPath("$.topicUrl").doesNotExist());
  }

  @Test
  void aDueReminderIsSentOncePerDay() throws Exception {
    perform(token, post("/api/stretch/items"), "{\"name\":\"Pigeon\",\"kind\":\"hold\",\"amount\":45,\"perSide\":true}")
        .andExpect(status().isCreated());
    perform(token, post("/api/stretch/items"), "{\"name\":\"Cat-cow\",\"kind\":\"reps\",\"amount\":10}")
        .andExpect(status().isCreated());
    StretchReminder reminder = enableAt("08:00", "Europe/Berlin");

    reminderService.sendDueReminders(MORNING);
    reminderService.sendDueReminders(MORNING.plusSeconds(600));

    // The job runs outside a request, so the routine must load without a session
    verify(ntfy, times(1)).publish(argThat(m -> m.topic().equals(reminder.getTopic())
        && m.body().equals("Daily stretch: 2 stretches, about 2 min.")
        && m.actions().stream().anyMatch(a -> a.url().equals(
            "https://training.example.com/api/stretch/reminder/done/" + reminder.getDoneToken()))));
    assertThat(reminderRepository.findByUserId(userId).orElseThrow().getLastSentOn()).isEqualTo(MORNING_DAY);
  }

  @Test
  void noReminderBeforeItsTimeOrAfterStretching() throws Exception {
    StretchReminder reminder = enableAt("09:00", "Europe/Berlin");
    reminderService.sendDueReminders(MORNING);

    perform(token, put("/api/stretch/check-ins/" + MORNING_DAY), null).andExpect(status().isNoContent());
    reminderService.sendDueReminders(MORNING.plusSeconds(3600));

    verify(ntfy, never()).publish(argThat(m -> m.topic().equals(reminder.getTopic())));
  }

  @Test
  void theDoneButtonChecksOffTodayWithoutALogin() throws Exception {
    StretchReminder reminder = enableAt("08:00", "Pacific/Kiritimati");

    mockMvc.perform(post("/api/stretch/reminder/done/" + reminder.getDoneToken()))
        .andExpect(status().isNoContent());
    mockMvc.perform(post("/api/stretch/reminder/done/not-a-token"))
        .andExpect(status().isNotFound());

    perform(token, get("/api/stretch/check-ins"), null)
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$", hasItem(LocalDate.now(ZoneId.of("Pacific/Kiritimati")).toString())));
  }

  /** Turns the reminder on and clears the sent mark that saving may set. */
  private StretchReminder enableAt(String time, String zone) throws Exception {
    perform(token, put("/api/stretch/reminder"), "{\"enabled\":true,\"time\":\"" + time + "\",\"timeZone\":\"" + zone + "\"}")
        .andExpect(status().isOk());
    StretchReminder reminder = reminderRepository.findByUserId(userId).orElseThrow();
    reminder.setLastSentOn(null);
    return reminderRepository.save(reminder);
  }

  private String register() throws Exception {
    String name = "test_" + UUID.randomUUID().toString().substring(0, 8);
    String body = """
        {"username":"%s","email":"%s@example.com","password":"password123"}
        """.formatted(name, name);
    return mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
  }

  private ResultActions perform(String accessToken, MockHttpServletRequestBuilder request, String body) throws Exception {
    request.header("Authorization", "Bearer " + accessToken);
    if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
    return mockMvc.perform(request);
  }
}
