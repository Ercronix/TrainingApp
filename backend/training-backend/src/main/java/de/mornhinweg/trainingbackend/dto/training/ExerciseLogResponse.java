package de.mornhinweg.trainingbackend.dto.training;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseLogResponse {
  private Long id;
  private Long exerciseId;
  private Long libraryExerciseId;
  private String exerciseName;
  private Long workoutId;
  private String workoutName;
  private Integer plannedSets;
  private Integer plannedReps;
  private BigDecimal plannedWeight;
  // Summary of the working sets: their count, and the reps and weight of the heaviest
  private Integer setsCompleted;
  private Integer repsCompleted;
  private BigDecimal weightUsed;
  private List<SetLogResponse> sets;
  private Boolean completed;
  private String notes;
  private String repUnit;

  // What was done for this exercise in the most recent completed session (null if never trained)
  private Integer previousSets;
  private Integer previousReps;
  private BigDecimal previousWeight;
  private List<SetLogResponse> previousSetLogs;
}