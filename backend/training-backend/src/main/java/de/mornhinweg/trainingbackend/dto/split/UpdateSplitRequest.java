package de.mornhinweg.trainingbackend.dto.split;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSplitRequest {

  @NotBlank(message = "Name is required")
  @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
  private String name;

  private Integer currentBlock;

  // Mesocycle length in weeks (2-12, the last a deload), 0 to turn it off, or null to leave it
  private Integer mesocycleWeeks;

  // The client's local date the cycle's first week started on, or null to leave it (today when a
  // mesocycle is turned on without one)
  private LocalDate mesocycleStartDate;
}
