package de.mornhinweg.trainingbackend.dto.library;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.*;

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
}
