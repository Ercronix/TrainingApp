package de.mornhinweg.trainingbackend.dto.exercise;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExerciseResponse {
  private Long id;
  private Long workoutId;
  private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private Integer sets;
  private Integer reps;
  private BigDecimal plannedWeight;
  private BigDecimal lastUsedWeight;
  private LocalDateTime lastTrainedAt;
  private Integer orderIndex;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}