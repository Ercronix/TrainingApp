package de.mornhinweg.trainingbackend.dto.training;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddExerciseLogRequest {

  // Either an existing library entry or a name (matched against the library, added when new)
  private Long libraryExerciseId;

  @Size(max = 100)
  private String name;

  private Integer sets;

  private Integer reps;

  private BigDecimal plannedWeight;

  @NotNull(message = "addToWorkout is required")
  private Boolean addToWorkout;
}

