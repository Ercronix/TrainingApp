package de.mornhinweg.trainingbackend.dto.exercise;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReorderExercisesRequest {

  private List<ExerciseOrderItem> exercises;

  @Getter @Setter @NoArgsConstructor @AllArgsConstructor
  public static class ExerciseOrderItem {
    private Long id;
    private Integer orderIndex;
  }
}