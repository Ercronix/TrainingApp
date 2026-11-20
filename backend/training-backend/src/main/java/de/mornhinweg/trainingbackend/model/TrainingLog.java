package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "training_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "split_id", nullable = false)
  private TrainingSplit split;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "workout_id", nullable = false)
  private Workout workout;

  @Column(name = "started_at", nullable = false)
  private LocalDateTime startedAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  // Last input in the session: logged sets, or added, swapped or removed exercises
  @Column(name = "last_activity_at", nullable = false)
  private LocalDateTime lastActivityAt;

  @Column(name = "duration_seconds")
  private Integer durationSeconds;

  @Column(columnDefinition = "TEXT")
  private String notes;

  // Started in a mesocycle's deload week: its targets are lowered (see Deload) and it stays out
  // of the progression trend and the "previous session" values
  @Column(nullable = false)
  @Builder.Default
  private Boolean deload = false;

  // The user's 1-5 ratings: how the session felt, their energy, and their sleep the night before
  private Integer rating;

  private Integer energy;

  private Integer sleep;

  @OneToMany(mappedBy = "trainingLog", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("id ASC")
  @Builder.Default
  private List<ExerciseLog> exerciseLogs = new ArrayList<>();

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
    if (lastActivityAt == null) lastActivityAt = startedAt;
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public boolean isCompleted() {
    return completedAt != null;
  }
}
