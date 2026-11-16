package de.mornhinweg.trainingbackend.dto.stretch;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

// On create, name, kind and amount are required; on update, null fields are left unchanged
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StretchItemRequest {
  @Size(max = 100) private String name;
  // "hold" (amount in seconds) or "reps"
  @Pattern(regexp = "hold|reps") private String kind;
  @Min(1) @Max(3600) private Integer amount;
  private Boolean perSide;
  private String note;
}
