package de.mornhinweg.trainingbackend.dto.stretch;

import de.mornhinweg.trainingbackend.model.StretchItem;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StretchItemResponse {
  private Long id;
  private String name;
  private String kind;
  private Integer amount;
  private Boolean perSide;
  private String note;
  private Integer orderIndex;

  public static StretchItemResponse from(StretchItem item) {
    return StretchItemResponse.builder()
        .id(item.getId())
        .name(item.getName())
        .kind(item.getKind())
        .amount(item.getAmount())
        .perSide(item.getPerSide())
        .note(item.getNote())
        .orderIndex(item.getOrderIndex())
        .build();
  }
}
