package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * A movement in the user's exercise library. Workout exercises point at an entry and add
 * their own plan (sets, reps, weight), so one entry can appear in several workouts.
 */
@Entity
@Table(name = "library_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryExercise {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "video_url", length = 500)
  private String videoUrl;

  @Column(name = "video_id", length = 50)
  private String videoId;

  @Column(name = "rep_unit", nullable = false, length = 10)
  @Builder.Default
  private String repUnit = "reps";

  @ElementCollection
  @CollectionTable(name = "library_exercise_muscles", joinColumns = @JoinColumn(name = "library_exercise_id"))
  @BatchSize(size = 100)
  @Builder.Default
  private Set<MuscleTarget> muscles = new HashSet<>();

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
