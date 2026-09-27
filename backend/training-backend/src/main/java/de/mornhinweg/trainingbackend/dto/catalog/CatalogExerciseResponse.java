package de.mornhinweg.trainingbackend.dto.catalog;

import de.mornhinweg.trainingbackend.dto.library.MuscleTargetDto;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CatalogExerciseResponse {
  private Long id;
  private String name;
  private String equipment;
  private String category;
  private List<MuscleTargetDto> muscles;
}
