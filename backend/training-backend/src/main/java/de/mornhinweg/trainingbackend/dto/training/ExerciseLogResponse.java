package de.mornhinweg.trainingbackend.dto.training;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseLogResponse {

  private Long id;
  private Long workoutId;
  private String workoutName;

  private Integer plannedSets;
  private Integer plannedReps;
  private BigDecimal plannedWeight;

  private Integer setsCompleted;
  private Integer repsCompleted;
  private BigDecimal weightUsed;

  private Boolean completed;
  private String notes;
}