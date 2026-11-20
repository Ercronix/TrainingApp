package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** A day on which the user stretched, as a date in their own time zone. */
@Entity
@Table(name = "stretch_check_ins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StretchCheckIn {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  private LocalDate day;

  @Column(name = "completed_at", nullable = false)
  private LocalDateTime completedAt;

  @PrePersist
  protected void onCreate() {
    if (completedAt == null) completedAt = LocalDateTime.now();
  }
}
