package de.mornhinweg.trainingbackend.dto.library;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

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
}
