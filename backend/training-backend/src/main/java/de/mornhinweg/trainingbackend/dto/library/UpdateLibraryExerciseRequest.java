package de.mornhinweg.trainingbackend.dto.library;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateLibraryExerciseRequest {
  @Size(min = 1, max = 100) private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private String repUnit;
  // Catalog vocabulary (barbell, dumbbell, ...); null leaves it unchanged, an empty string clears it
  @Size(max = 30) private String equipment;
  // Replaces the entry's muscles when present; an empty list clears them
  private List<@Valid MuscleTargetDto> muscles;
  // The catalog exercise picked for it; null leaves the link unchanged, 0 removes it
  private Long catalogExerciseId;
  // Kg the suggested next target adds; null leaves it unchanged, 0 goes back to the default
  @DecimalMin("0") @DecimalMax("100") private BigDecimal weightIncrement;
}
