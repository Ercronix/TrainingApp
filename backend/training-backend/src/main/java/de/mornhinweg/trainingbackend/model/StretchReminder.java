package de.mornhinweg.trainingbackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * A daily ntfy push at a set time in the user's own time zone, skipped on days they already
 * stretched. The topic and the done token are random secrets.
 */
@Entity
@Table(name = "stretch_reminders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StretchReminder {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "remind_at", nullable = false)
  private LocalTime remindAt;

  /** IANA zone id, e.g. Europe/Berlin. */
  @Column(name = "time_zone", nullable = false, length = 64)
  private String timeZone;

  @Column(nullable = false, unique = true, length = 64)
  private String topic;

  @Column(name = "done_token", nullable = false, unique = true, length = 64)
  private String doneToken;

  /** The user's local day the last reminder went out. */
  @Column(name = "last_sent_on")
  private LocalDate lastSentOn;

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
