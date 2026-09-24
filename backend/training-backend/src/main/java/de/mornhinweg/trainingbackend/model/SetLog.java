package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One performed set of an exercise in a training session. */
@Entity
@Table(name = "set_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "exercise_log_id", nullable = false)
  private ExerciseLog exerciseLog;

  @Column(name = "set_index", nullable = false)
  private Integer setIndex;

  // Seconds for exercises whose rep unit is "seconds"
  @Column(nullable = false)
  @Builder.Default
  private Integer reps = 0;

  @Column(precision = 5, scale = 2)
  private BigDecimal weight;

  @Column(precision = 3, scale = 1)
  private BigDecimal rpe;

  @Column(nullable = false)
  @Builder.Default
  private Boolean warmup = false;

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
