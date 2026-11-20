package de.mornhinweg.trainingbackend.dto.exercise;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseResponse {
  private Long id;
  private Long workoutId;
  private Long libraryExerciseId;
  private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private Integer sets;
  private Integer reps;
  // Top of the rep range (reps is its bottom); null for a fixed rep count
  private Integer repsMax;
  private String repUnit;
  private BigDecimal plannedWeight;
  private BigDecimal lastUsedWeight;
  private LocalDateTime lastTrainedAt;
  private Integer orderIndex;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  // Exercises with the same group (adjacent in order) form a superset or circuit; null when not grouped
  private Integer supersetGroup;
}