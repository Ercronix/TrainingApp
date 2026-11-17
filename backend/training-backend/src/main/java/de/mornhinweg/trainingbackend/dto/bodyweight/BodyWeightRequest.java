package de.mornhinweg.trainingbackend.dto.bodyweight;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/** The weight for the day in the path. A missing or empty note clears it. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BodyWeightRequest {
  /** In kg, up to two decimals. */
  @NotNull
  @DecimalMin(value = "0", inclusive = false)
  @DecimalMax("999.99")
  @Digits(integer = 3, fraction = 2)
  private BigDecimal weight;

  @Size(max = 500)
  private String note;
}
