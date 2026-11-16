package de.mornhinweg.trainingbackend.dto.stretch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateStretchReminderRequest {
  @NotNull private Boolean enabled;
  // 24-hour HH:mm
  @NotBlank @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d") private String time;
  // IANA zone id, e.g. Europe/Berlin
  @NotBlank @Size(max = 64) private String timeZone;
}
