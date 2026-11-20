package de.mornhinweg.trainingbackend.dto.training;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartTrainingRequest {

  @NotNull(message = "Workout ID is required")
  private Long workoutId;

  // The client's local date, which decides whether the session falls in a deload week
  // (the server's date when null, e.g. from older clients)
  private LocalDate localDate;
}
