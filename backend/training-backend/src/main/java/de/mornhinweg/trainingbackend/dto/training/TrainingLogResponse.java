package de.mornhinweg.trainingbackend.dto.training;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingLogResponse {

  private Long id;
  private Long splitId;
  private String splitName;
  private LocalDateTime startedAt;
  private LocalDateTime completedAt;
  private Integer durationSeconds;
  private String notes;

  private List<ExerciseLogResponse> exercises;

  private Boolean isCompleted;
}