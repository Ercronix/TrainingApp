package de.mornhinweg.trainingbackend.dto.stretch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateStretchRoutineRequest {
  @NotBlank @Size(max = 100) private String name;
}
