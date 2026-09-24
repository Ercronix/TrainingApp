package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

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

  // The sets actually performed. The summary columns above are derived from them (see replaceSets).
  @OneToMany(mappedBy = "exerciseLog", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("setIndex ASC")
  @BatchSize(size = 100)
  @Builder.Default
  private List<SetLog> setLogs = new ArrayList<>();

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

  /**
   * Replaces the logged sets and recomputes the summary: the number of working sets and the
   * reps and weight of the heaviest one. Existing rows are updated in place, which keeps
   * (exercise_log_id, set_index) unique without relying on Hibernate's flush order.
   */
  public void replaceSets(List<SetLog> sets) {
    for (int i = 0; i < sets.size(); i++) {
      SetLog source = sets.get(i);
      SetLog target;
      if (i < setLogs.size()) {
        target = setLogs.get(i);
      } else {
        target = SetLog.builder().exerciseLog(this).setIndex(i).build();
        setLogs.add(target);
      }
      target.setReps(source.getReps());
      target.setWeight(source.getWeight());
      target.setRpe(source.getRpe());
      target.setWarmup(source.getWarmup());
    }
    while (setLogs.size() > sets.size()) {
      setLogs.remove(setLogs.size() - 1);
    }

    List<SetLog> working = setLogs.stream().filter(s -> !s.getWarmup()).toList();
    SetLog top = working.stream()
        .max(Comparator.comparing((SetLog s) -> s.getWeight() != null ? s.getWeight() : BigDecimal.ZERO)
            .thenComparing(SetLog::getReps))
        .orElse(null);
    setsCompleted = working.size();
    repsCompleted = top != null ? top.getReps() : 0;
    weightUsed = top != null ? top.getWeight() : null;
  }
}
