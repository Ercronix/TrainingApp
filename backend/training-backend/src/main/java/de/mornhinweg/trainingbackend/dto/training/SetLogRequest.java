package de.mornhinweg.trainingbackend.dto.training;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SetLogRequest {

  @NotNull(message = "reps is required")
  @Min(0)
  private Integer reps;

  @DecimalMin("0")
  @DecimalMax("999.99")
  private BigDecimal weight;

  @DecimalMin("1")
  @DecimalMax("10")
  private BigDecimal rpe;

  private Boolean warmup;
}
