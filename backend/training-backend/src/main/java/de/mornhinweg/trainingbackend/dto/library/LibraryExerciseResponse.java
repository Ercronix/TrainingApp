package de.mornhinweg.trainingbackend.dto.library;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LibraryExerciseResponse {
  private Long id;
  private String name;
  private String description;
  private String videoUrl;
  private String videoId;
  private String repUnit;
  private String equipment;
  private Long catalogExerciseId;
  // Kg the suggested next target adds; null for the client's default (2.5 kg)
  private BigDecimal weightIncrement;
  private List<MuscleTargetDto> muscles;
  // Number of workouts (templates, not one-off session exercises) that use this entry
  private long workoutCount;
  private LocalDateTime lastTrainedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
