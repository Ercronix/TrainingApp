package de.mornhinweg.trainingbackend.dto.library;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateLibraryExerciseRequest {
  @NotBlank @Size(max = 100) private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private String repUnit;
}
