package de.mornhinweg.trainingbackend.dto.exercise;

import de.mornhinweg.trainingbackend.dto.library.MuscleTargetDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

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
  // The bottom of the rep range (or the fixed rep count)
  private Integer reps;
  // The top of the rep range; null or 0 (or the same as reps) for a fixed rep count
  @Min(0) private Integer repsMax;
  private String repUnit;
  // Catalog vocabulary (barbell, dumbbell, ...); null leaves it unchanged, an empty string clears it
  @Size(max = 30) private String equipment;
  private BigDecimal plannedWeight;
  // Replaces the library entry's muscles when present
  private List<@Valid MuscleTargetDto> muscles;
  // The catalog exercise picked for it; null leaves the link unchanged, 0 removes it
  private Long catalogExerciseId;
}