package de.mornhinweg.trainingbackend.dto.exercise;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseProgressResponse {

  // Null when the progress was requested for a library entry rather than a workout exercise
  private Long exerciseId;
  private Long libraryExerciseId;
  private String exerciseName;
  private List<ProgressEntry> entries;

  @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
  public static class ProgressEntry {
    private LocalDateTime date;
    private BigDecimal weightUsed;
    private Integer setsCompleted;
    private Integer repsCompleted;
    private Long trainingLogId;
    // Progress covers every workout that uses the library entry
    private String workoutName;
  }
}