package de.mornhinweg.trainingbackend.dto.exercise;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateExerciseRequest {
  @NotBlank private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private Integer sets;
  private Integer reps;
  private BigDecimal plannedWeight;
}