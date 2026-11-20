package de.mornhinweg.trainingbackend.dto.split;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplitResponse {

  private Long id;
  private String name;
  private Boolean isActive;
  private Integer currentBlock;
  // Both null without a mesocycle. The client derives the current week from its own local date.
  private Integer mesocycleWeeks;
  private LocalDate mesocycleStartDate;
  private Integer workoutCount;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}