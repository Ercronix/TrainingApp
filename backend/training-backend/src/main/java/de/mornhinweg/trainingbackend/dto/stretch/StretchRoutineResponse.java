package de.mornhinweg.trainingbackend.dto.stretch;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StretchRoutineResponse {
  private Long id;
  private String name;
  private List<StretchItemResponse> items;
}
