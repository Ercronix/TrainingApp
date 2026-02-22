package de.mornhinweg.trainingbackend.dto.exercise;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseProgressResponse {

  private Long exerciseId;
  private String exerciseName;
  private List<ProgressEntry> entries;

  @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
  public static class ProgressEntry {
    private LocalDateTime date;
    private BigDecimal weightUsed;
    private Integer setsCompleted;
    private Integer repsCompleted;
    private Long trainingLogId;
  }
}