package de.mornhinweg.trainingbackend.dto.exercise;

import jakarta.validation.constraints.Min;
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
  // The top of the rep range; null leaves it unchanged, 0 makes the rep count fixed again
  @Min(0) private Integer repsMax;
  private String repUnit;
  private BigDecimal plannedWeight;
  private Integer orderIndex;
}