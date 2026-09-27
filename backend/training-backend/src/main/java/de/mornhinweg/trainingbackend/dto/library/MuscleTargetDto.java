package de.mornhinweg.trainingbackend.dto.library;

import de.mornhinweg.trainingbackend.model.Muscle;
import de.mornhinweg.trainingbackend.model.MuscleRole;
import de.mornhinweg.trainingbackend.model.MuscleTarget;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MuscleTargetDto {
  @NotNull private Muscle muscle;
  @NotNull private MuscleRole role;

  /** Primary muscles first, then in enum order. */
  public static List<MuscleTargetDto> fromAll(Collection<MuscleTarget> targets) {
    return targets.stream()
        .sorted(Comparator.comparing(MuscleTarget::getRole).thenComparing(MuscleTarget::getMuscle))
        .map(t -> new MuscleTargetDto(t.getMuscle(), t.getRole()))
        .toList();
  }
}
