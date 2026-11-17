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
  // The bottom of the planned rep range, or the fixed rep count when plannedRepsMax is null
  private Integer plannedReps;
  private Integer plannedRepsMax;
  private BigDecimal plannedWeight;
  // Summary of the working sets: their count, and the reps and weight of the heaviest
  private Integer setsCompleted;
  private Integer repsCompleted;
  private BigDecimal weightUsed;
  private List<SetLogResponse> sets;
  private Boolean completed;
  private String notes;
  private String repUnit;
  private String equipment;
  // Of the library entry: the weight a suggested next target adds (null for the client's default)
  private BigDecimal weightIncrement;

  // What was done for this exercise in the most recent completed session (null if never trained)
  private Integer previousSets;
  private Integer previousReps;
  private BigDecimal previousWeight;
  private List<SetLogResponse> previousSetLogs;
  // The sets of the completed session before that one (null if there is none), so the client
  // can tell when reps stayed below the plan two sessions in a row
  private List<SetLogResponse> earlierSetLogs;

  // Best working set weight and estimated 1RM of sessions completed before this one (null if none)
  private BigDecimal bestWeight;
  private Double bestOneRepMax;

  // The workout exercise's superset group, so a session can run supersets from cached data.
  // Adjacent logs with the same group form a superset or circuit; null when not grouped.
  private Integer supersetGroup;
}