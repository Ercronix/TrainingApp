package de.mornhinweg.trainingbackend.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Publishes to an ntfy server (https://ntfy.sh or a self-hosted one). Without `ntfy.base-url`
 * nothing is sent and reminders can't be turned on.
 */
@Component
public class NtfyClient {

  private final String baseUrl;
  private final RestClient restClient;

  public NtfyClient(
      @Value("${ntfy.base-url:}") String baseUrl,
      @Value("${ntfy.token:}") String token) {
    this.baseUrl = baseUrl.replaceAll("/+$", "");
    RestClient.Builder builder = RestClient.builder();
    // An access token, for servers that don't allow anonymous publishing
    if (!token.isBlank()) {
      builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
    this.restClient = builder.build();
  }

  public boolean isConfigured() {
    return !baseUrl.isBlank();
  }

  /** Where a topic can be subscribed to, e.g. https://ntfy.example.com/stretch-abc. */
  public String topicUrl(String topic) {
    return baseUrl + "/" + topic;
  }

  public void publish(Message message) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("topic", message.topic());
    body.put("title", message.title());
    body.put("message", message.body());
    if (message.click() != null) body.put("click", message.click());
    if (!message.actions().isEmpty()) {
      body.put("actions", message.actions().stream().map(Action::toJson).toList());
    }
    restClient.post()
        .uri(baseUrl)
        .contentType(MediaType.APPLICATION_JSON)
        .body(body)
        .retrieve()
        .toBodilessEntity();
  }

  public record Message(String topic, String title, String body, String click, List<Action> actions) {}

  /** A notification button: "view" opens a URL, "http" sends a request from the phone. */
  public record Action(String action, String label, String url, String method, boolean clear) {

    public static Action view(String label, String url) {
      return new Action("view", label, url, null, false);
    }

    public static Action post(String label, String url) {
      return new Action("http", label, url, "POST", true);
    }

    Map<String, Object> toJson() {
      Map<String, Object> json = new LinkedHashMap<>();
      json.put("action", action);
      json.put("label", label);
      json.put("url", url);
      if (method != null) json.put("method", method);
      if (clear) json.put("clear", true);
      return json;
    }
  }
}
