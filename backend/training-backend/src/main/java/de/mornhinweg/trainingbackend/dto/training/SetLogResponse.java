package de.mornhinweg.trainingbackend.dto.training;

import de.mornhinweg.trainingbackend.model.SetLog;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SetLogResponse {
  private Integer reps;
  private BigDecimal weight;
  private BigDecimal rpe;
  private Boolean warmup;

  public static List<SetLogResponse> fromAll(List<SetLog> sets) {
    return sets.stream()
        .map(s -> new SetLogResponse(s.getReps(), s.getWeight(), s.getRpe(), s.getWarmup()))
        .toList();
  }
}
