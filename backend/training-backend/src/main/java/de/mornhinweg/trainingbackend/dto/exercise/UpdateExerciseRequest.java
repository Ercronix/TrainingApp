package de.mornhinweg.trainingbackend.dto.exercise;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateExerciseRequest {
  private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private Integer sets;
  private Integer reps;
  private BigDecimal plannedWeight;
  private Integer orderIndex;
}