package de.mornhinweg.trainingbackend.dto.stretch;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReorderStretchItemsRequest {

  private List<ItemOrder> items;

  @Getter @Setter @NoArgsConstructor @AllArgsConstructor
  public static class ItemOrder {
    private Long id;
    private Integer orderIndex;
  }
}
