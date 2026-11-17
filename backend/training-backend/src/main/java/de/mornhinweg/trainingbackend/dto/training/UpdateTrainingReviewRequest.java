package de.mornhinweg.trainingbackend.dto.training;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * The user's ratings (1-5) and note for a session. Replaces all four, so a null clears that value
 * and sending the same review again changes nothing.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTrainingReviewRequest {
  // How the session felt
  @Min(1) @Max(5)
  private Integer rating;

  @Min(1) @Max(5)
  private Integer energy;

  // How well the user slept the night before
  @Min(1) @Max(5)
  private Integer sleep;

  @Size(max = 2000)
  private String notes;
}
