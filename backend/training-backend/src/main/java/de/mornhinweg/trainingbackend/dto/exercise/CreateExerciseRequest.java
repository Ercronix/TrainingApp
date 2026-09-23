package de.mornhinweg.trainingbackend.dto.exercise;

import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateExerciseRequest {
  // Either an existing library entry, or a name that is matched against the library
  // (case-insensitive) and added to it when there is no match.
  private Long libraryExerciseId;
  @Size(max = 100) private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private Integer sets;
  private Integer reps;
  private String repUnit;
  private BigDecimal plannedWeight;
}