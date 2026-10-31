package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** A stretch of a routine, held for {@code amount} seconds or repeated {@code amount} times. */
@Entity
@Table(name = "stretch_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StretchItem {

  public static final String HOLD = "hold";
  public static final String REPS = "reps";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "routine_id", nullable = false)
  private StretchRoutine routine;

  @Column(nullable = false, length = 100)
  private String name;

  // HOLD (amount in seconds) or REPS (amount in repetitions)
  @Column(nullable = false, length = 10)
  private String kind;

  @Column(nullable = false)
  private Integer amount;

  // Done once on each side, left then right
  @Column(name = "per_side", nullable = false)
  @Builder.Default
  private Boolean perSide = false;

  @Column(columnDefinition = "TEXT")
  private String note;

  @Column(name = "order_index", nullable = false)
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
