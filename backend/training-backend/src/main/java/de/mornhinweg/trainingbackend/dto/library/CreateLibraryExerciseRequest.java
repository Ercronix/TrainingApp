package de.mornhinweg.trainingbackend.dto.library;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateLibraryExerciseRequest {
  @NotBlank @Size(max = 100) private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private String repUnit;
  // Catalog vocabulary (barbell, dumbbell, ...); null leaves it unchanged, an empty string clears it
  @Size(max = 30) private String equipment;
  // Muscles the exercise trains, e.g. taken from a catalog exercise
  private List<@Valid MuscleTargetDto> muscles;
  // The catalog exercise picked for it, if any
  private Long catalogExerciseId;
  // Kg the suggested next target adds; null or 0 for the default
  @DecimalMin("0") @DecimalMax("100") private BigDecimal weightIncrement;
}
