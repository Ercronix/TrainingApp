package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.catalog.CatalogExerciseResponse;
import de.mornhinweg.trainingbackend.dto.library.MuscleTargetDto;
import de.mornhinweg.trainingbackend.repository.CatalogExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** The catalog is the same for every user and read-only, so there is no ownership check. */
@Service
@RequiredArgsConstructor
public class ExerciseCatalogService {

  private final CatalogExerciseRepository catalogExerciseRepository;

  @Transactional(readOnly = true)
  public List<CatalogExerciseResponse> getCatalog() {
    return catalogExerciseRepository.findAllOrderByName().stream()
        .map(c -> CatalogExerciseResponse.builder()
            .id(c.getId())
            .name(c.getName())
            .equipment(c.getEquipment())
            .category(c.getCategory())
            .muscles(MuscleTargetDto.fromAll(c.getMuscles()))
            .build())
        .toList();
  }
}
