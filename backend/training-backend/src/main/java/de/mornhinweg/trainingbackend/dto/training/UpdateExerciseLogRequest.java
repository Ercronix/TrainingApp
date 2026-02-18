package de.mornhinweg.trainingbackend.dto.training;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateExerciseLogRequest {
  private Integer setsCompleted;
  private Integer repsCompleted;
  private BigDecimal weightUsed;
  private Boolean completed;
  private String notes;
}