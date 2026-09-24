package de.mornhinweg.trainingbackend.dto.exercise;

import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateExerciseRequest {
  // Changing the library entry or the name links this exercise to another library entry;
  // description, video and rep unit edit the linked entry, so they apply to every workout using it.
  private Long libraryExerciseId;
  @Size(min = 1, max = 100) private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private Integer sets;
  private Integer reps;
  private String repUnit;
  private BigDecimal plannedWeight;
  private Integer orderIndex;
}