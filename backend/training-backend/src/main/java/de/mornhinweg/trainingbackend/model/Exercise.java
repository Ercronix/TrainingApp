package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "workout_id", nullable = false)
  private Workout workout;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "video_url", length = 500)
  private String videoUrl;

  @Column(name = "video_id", length = 50)
  private String videoId;

  @Column
  private Integer sets;

  @Column
  private Integer reps;

  @Column(name = "planned_weight", precision = 5, scale = 2)
  private BigDecimal plannedWeight;

  @Column(name = "last_used_weight", precision = 5, scale = 2)
  private BigDecimal lastUsedWeight;

  @Column(name = "last_trained_at")
  private LocalDateTime lastTrainedAt;

  @Column(name = "order_index")
  @Builder.Default
  private Integer orderIndex = 0;

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