package de.mornhinweg.trainingbackend.dto.library;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LibraryExerciseResponse {
  private Long id;
  private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private String repUnit;
  // Number of workouts (templates, not one-off session exercises) that use this entry
  private long workoutCount;
  private LocalDateTime lastTrainedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
