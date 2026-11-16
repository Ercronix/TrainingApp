package de.mornhinweg.trainingbackend.dto.stretch;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StretchReminderResponse {
  private boolean enabled;
  // HH:mm in timeZone
  private String time;
  private String timeZone;
  // False when the server has no ntfy server set up; reminders can't be turned on then
  private boolean available;
  private String topic;
  // The topic on the ntfy server, to subscribe to; null when not available
  private String topicUrl;
  // Whether the notification gets a "Done" button (needs the server's public URL)
  private boolean doneButton;
}
