package de.mornhinweg.trainingbackend.dto.workout;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutResponse {
  private Long id;
  private Long splitId;
  private String name;
  private Integer exerciseCount;
  private Integer orderIndex;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}