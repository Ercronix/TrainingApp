package de.mornhinweg.trainingbackend.dto.training;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompleteTrainingRequest {
  private String notes;

  // How long ago the user finished, for a session completed offline and sent later
  @PositiveOrZero
  private Long completedSecondsAgo;
}