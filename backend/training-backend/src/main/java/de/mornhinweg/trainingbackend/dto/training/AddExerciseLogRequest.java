package de.mornhinweg.trainingbackend.dto.training;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddExerciseLogRequest {

  @NotBlank(message = "Exercise name is required")
  private String name;

  private Integer sets;

  private Integer reps;

  private BigDecimal plannedWeight;

  @NotNull(message = "addToWorkout is required")
  private Boolean addToWorkout;
}

