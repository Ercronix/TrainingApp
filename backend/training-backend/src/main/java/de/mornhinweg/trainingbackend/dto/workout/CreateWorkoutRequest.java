package de.mornhinweg.trainingbackend.dto.workout;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkoutRequest {

  @NotBlank(message = "Name is required")
  @Size(min = 2, max = 100)
  private String name;

  private String description;

  private String videoUrl;

  private String videoId;

  private Integer sets;

  private Integer reps;

  private BigDecimal plannedWeight;
}