package de.mornhinweg.trainingbackend.dto.split;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplitResponse {

  private Long id;
  private String name;
  private Boolean isActive;
  private Integer workoutCount;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}