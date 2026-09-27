package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;

/** A muscle an exercise trains, and whether it is a primary or secondary mover. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class MuscleTarget {

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Muscle muscle;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private MuscleRole role;
}
