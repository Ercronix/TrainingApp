package de.mornhinweg.trainingbackend.dto.bodyweight;

import de.mornhinweg.trainingbackend.model.BodyWeightEntry;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BodyWeightResponse {
  private Long id;
  /** The client's local date the weight was logged for (yyyy-MM-dd). */
  private LocalDate date;
  /** In kg. */
  private BigDecimal weight;
  private String note;

  public static BodyWeightResponse from(BodyWeightEntry entry) {
    return BodyWeightResponse.builder()
        .id(entry.getId())
        .date(entry.getDay())
        .weight(entry.getWeight())
        .note(entry.getNote())
        .build();
  }
}
