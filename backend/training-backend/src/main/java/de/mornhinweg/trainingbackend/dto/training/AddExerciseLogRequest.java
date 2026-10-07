package de.mornhinweg.trainingbackend.dto.training;

import de.mornhinweg.trainingbackend.dto.library.MuscleTargetDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

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

  // Catalog vocabulary (barbell, dumbbell, ...); null leaves it unchanged, an empty string clears it
  @Size(max = 30)
  private String equipment;

  // Replaces the library entry's muscles when present
  private List<@Valid MuscleTargetDto> muscles;

  @NotNull(message = "addToWorkout is required")
  private Boolean addToWorkout;
}

