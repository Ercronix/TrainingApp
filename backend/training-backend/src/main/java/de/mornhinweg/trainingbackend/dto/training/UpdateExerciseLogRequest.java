package de.mornhinweg.trainingbackend.dto.training;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateExerciseLogRequest {

  // Replaces every logged set when present; the summary fields are then derived from it
  @Valid
  @Size(max = 50)
  private List<SetLogRequest> sets;

  // Without `sets`, these are expanded into identical sets (older clients, quick-complete)
  private Integer setsCompleted;
  private Integer repsCompleted;
  private BigDecimal weightUsed;
  private Boolean completed;
  private String notes;
}
