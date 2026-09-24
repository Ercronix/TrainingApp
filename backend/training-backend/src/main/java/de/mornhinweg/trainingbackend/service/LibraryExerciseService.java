package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.exercise.ExerciseProgressResponse;
import de.mornhinweg.trainingbackend.dto.library.CreateLibraryExerciseRequest;
import de.mornhinweg.trainingbackend.dto.library.LibraryExerciseResponse;
import de.mornhinweg.trainingbackend.dto.library.UpdateLibraryExerciseRequest;
import de.mornhinweg.trainingbackend.dto.training.SetLogResponse;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ConflictException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.ExerciseLog;
import de.mornhinweg.trainingbackend.model.LibraryExercise;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.ExerciseLogRepository;
import de.mornhinweg.trainingbackend.repository.ExerciseRepository;
import de.mornhinweg.trainingbackend.repository.LibraryExerciseRepository;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LibraryExerciseService {

  private final LibraryExerciseRepository libraryExerciseRepository;
  private final ExerciseRepository exerciseRepository;
  private final ExerciseLogRepository exerciseLogRepository;
  private final UserRepository userRepository;

  public List<LibraryExerciseResponse> getLibrary(Authentication authentication) {
    User user = getCurrentUser(authentication);
    Map<Long, Object[]> usage = exerciseRepository.findUsageByUserId(user.getId()).stream()
        .collect(Collectors.toMap(row -> (Long) row[0], row -> row));
    return libraryExerciseRepository.findByUserIdOrderByName(user.getId()).stream()
        .map(entry -> toResponse(entry, usage.get(entry.getId())))
        .collect(Collectors.toList());
  }

  @Transactional
  public LibraryExerciseResponse createLibraryExercise(CreateLibraryExerciseRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);
    String name = request.getName().trim();
    if (libraryExerciseRepository.findByUserIdAndNameIgnoreCase(user.getId(), name).isPresent()) {
      throw new ConflictException("An exercise named \"" + name + "\" is already in your library");
    }
    LibraryExercise entry = LibraryExercise.builder()
        .user(user)
        .name(name)
        .description(request.getDescription())
        .videoUrl(request.getVideoUrl())
        .videoId(request.getVideoId())
        .repUnit(request.getRepUnit() != null ? request.getRepUnit() : "reps")
        .build();
    return toResponse(libraryExerciseRepository.save(entry), null);
  }

  @Transactional
  public LibraryExerciseResponse updateLibraryExercise(Long id, UpdateLibraryExerciseRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);
    LibraryExercise entry = getOwnedEntry(id, user);
    if (request.getName() != null) rename(entry, request.getName());
    applyDetails(entry, request.getDescription(), request.getVideoUrl(), request.getVideoId(), request.getRepUnit());
    entry = libraryExerciseRepository.save(entry);
    List<Object[]> usage = exerciseRepository.findUsageByLibraryExerciseId(entry.getId());
    return toResponse(entry, usage.isEmpty() ? null : usage.get(0));
  }

  @Transactional
  public void deleteLibraryExercise(Long id, Authentication authentication) {
    User user = getCurrentUser(authentication);
    LibraryExercise entry = getOwnedEntry(id, user);
    if (exerciseRepository.countByLibraryExerciseId(entry.getId()) > 0) {
      throw new ConflictException("\"" + entry.getName() + "\" is still used by a workout or training history");
    }
    libraryExerciseRepository.delete(entry);
  }

  public ExerciseProgressResponse getProgress(Long id, Authentication authentication) {
    User user = getCurrentUser(authentication);
    return buildProgress(getOwnedEntry(id, user), null);
  }

  /**
   * Returns the user's library entry for an exercise being added to a workout or session: the
   * given entry if an id is passed, otherwise the entry matching the name (ignoring case), which
   * is created when there is none.
   */
  @Transactional
  public LibraryExercise resolve(User user, Long libraryExerciseId, String name) {
    if (libraryExerciseId != null) {
      return getOwnedEntry(libraryExerciseId, user);
    }
    if (name == null || name.isBlank()) {
      throw new BadRequestException("Exercise name is required");
    }
    String trimmed = name.trim();
    return libraryExerciseRepository.findByUserIdAndNameIgnoreCase(user.getId(), trimmed)
        .orElseGet(() -> libraryExerciseRepository.save(
            LibraryExercise.builder().user(user).name(trimmed).build()));
  }

  /**
   * Returns the entry a single exercise should use after being renamed from {@code current}: the
   * existing entry with that name, otherwise {@code current} renamed in place if no other exercise
   * uses it, otherwise a new entry that keeps the details of {@code current}.
   */
  @Transactional
  public LibraryExercise renameFor(User user, LibraryExercise current, String name) {
    if (name == null || name.isBlank()) {
      throw new BadRequestException("Exercise name is required");
    }
    String trimmed = name.trim();
    return libraryExerciseRepository.findByUserIdAndNameIgnoreCase(user.getId(), trimmed)
        .orElseGet(() -> {
          if (exerciseRepository.countByLibraryExerciseId(current.getId()) <= 1) {
            current.setName(trimmed);
            return current;
          }
          return libraryExerciseRepository.save(LibraryExercise.builder()
              .user(user)
              .name(trimmed)
              .description(current.getDescription())
              .videoUrl(current.getVideoUrl())
              .videoId(current.getVideoId())
              .repUnit(current.getRepUnit())
              .build());
        });
  }

  /** Renames an entry, keeping names unique per user (a change of case only is allowed). */
  void rename(LibraryExercise entry, String name) {
    String trimmed = name.trim();
    if (trimmed.isEmpty()) {
      throw new BadRequestException("Exercise name is required");
    }
    libraryExerciseRepository.findByUserIdAndNameIgnoreCase(entry.getUser().getId(), trimmed)
        .filter(other -> !other.getId().equals(entry.getId()))
        .ifPresent(other -> {
          throw new ConflictException("An exercise named \"" + other.getName() + "\" is already in your library");
        });
    entry.setName(trimmed);
  }

  /** Applies the non-null fields to the entry. */
  void applyDetails(LibraryExercise entry, String description, String videoUrl, String videoId, String repUnit) {
    if (description != null) entry.setDescription(description);
    if (videoUrl != null) entry.setVideoUrl(videoUrl);
    if (videoId != null) entry.setVideoId(videoId);
    if (repUnit != null) entry.setRepUnit(repUnit);
  }

  ExerciseProgressResponse buildProgress(LibraryExercise entry, Long exerciseId) {
    List<ExerciseLog> logs = exerciseLogRepository.findCompletedByLibraryExerciseIdOrderByDate(entry.getId());

    List<ExerciseProgressResponse.ProgressEntry> entries = logs.stream()
        .map(log -> ExerciseProgressResponse.ProgressEntry.builder()
            .date(log.getTrainingLog().getCompletedAt())
            .weightUsed(log.getWeightUsed())
            .setsCompleted(log.getSetsCompleted())
            .repsCompleted(log.getRepsCompleted())
            .sets(SetLogResponse.fromAll(log.getSetLogs()))
            .trainingLogId(log.getTrainingLog().getId())
            .workoutName(log.getExercise().getWorkout().getName())
            .build())
        .collect(Collectors.toList());

    return ExerciseProgressResponse.builder()
        .exerciseId(exerciseId)
        .libraryExerciseId(entry.getId())
        .exerciseName(entry.getName())
        .entries(entries)
        .build();
  }

  private LibraryExercise getOwnedEntry(Long id, User user) {
    return libraryExerciseRepository.findByIdAndUserId(id, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Library exercise not found"));
  }

  private User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }

  /** {@code usage} is a row of {@link ExerciseRepository#findUsageByUserId}, or null when unused. */
  private LibraryExerciseResponse toResponse(LibraryExercise entry, Object[] usage) {
    return LibraryExerciseResponse.builder()
        .id(entry.getId())
        .name(entry.getName())
        .description(entry.getDescription())
        .videoUrl(entry.getVideoUrl())
        .videoId(entry.getVideoId())
        .repUnit(entry.getRepUnit())
        .workoutCount(usage != null ? ((Number) usage[1]).longValue() : 0)
        .lastTrainedAt(usage != null ? (LocalDateTime) usage[2] : null)
        .createdAt(entry.getCreatedAt())
        .updatedAt(entry.getUpdatedAt())
        .build();
  }
}
