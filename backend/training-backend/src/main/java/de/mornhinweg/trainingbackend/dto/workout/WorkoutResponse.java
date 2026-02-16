package de.mornhinweg.trainingbackend.dto.workout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutResponse {

  private Long id;
  private Long splitId;
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