package de.mornhinweg.trainingbackend.dto.training;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartTrainingRequest {

  @NotNull(message = "Split ID is required")
  private Long splitId;
}