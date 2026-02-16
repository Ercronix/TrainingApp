package de.mornhinweg.trainingbackend.dto.training;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExerciseRequest {

  private Integer setsCompleted;
  private Integer repsCompleted;
  private BigDecimal weightUsed;
  private Boolean completed;
  private String notes;
}