package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exercise_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "training_log_id", nullable = false)
  private TrainingLog trainingLog;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "exercise_id", nullable = false)
  private Exercise exercise;

  @Column(name = "sets_completed")
  @Builder.Default
  private Integer setsCompleted = 0;

  @Column(name = "reps_completed")
  @Builder.Default
  private Integer repsCompleted = 0;

  @Column(name = "weight_used", precision = 5, scale = 2)
  private BigDecimal weightUsed;

  @Column(nullable = false)
  @Builder.Default
  private Boolean completed = false;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}