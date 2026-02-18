package de.mornhinweg.trainingbackend.dto.workout;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateWorkoutRequest {
  @NotBlank private String name;
}