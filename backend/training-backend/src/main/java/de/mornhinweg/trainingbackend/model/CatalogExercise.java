package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.util.HashSet;
import java.util.Set;

/** A common exercise from the read-only catalog, seeded by migration and shared by all users. */
@Entity
@Table(name = "exercise_catalog")
@Getter
@NoArgsConstructor
public class CatalogExercise {

  @Id
  private Long id;

  @Column(nullable = false, length = 100)
  private String slug;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(length = 30)
  private String equipment;

  @Column(nullable = false, length = 30)
  private String category;

  @ElementCollection
  @CollectionTable(name = "exercise_catalog_muscles", joinColumns = @JoinColumn(name = "catalog_exercise_id"))
  @BatchSize(size = 1000)
  private Set<MuscleTarget> muscles = new HashSet<>();
}
