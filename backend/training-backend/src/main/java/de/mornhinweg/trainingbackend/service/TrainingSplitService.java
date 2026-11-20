package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.split.CreateSplitRequest;
import de.mornhinweg.trainingbackend.dto.split.RestartMesocycleRequest;
import de.mornhinweg.trainingbackend.dto.split.SplitResponse;
import de.mornhinweg.trainingbackend.dto.split.UpdateSplitRequest;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.TrainingSplit;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.TrainingSplitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingSplitService {

  private final TrainingSplitRepository trainingSplitRepository;
  private final CurrentUserService currentUser;

  public List<SplitResponse> getAllSplits(Authentication authentication) {
    User user = currentUser.get(authentication);

    return trainingSplitRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public SplitResponse createSplit(CreateSplitRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);

    TrainingSplit split = TrainingSplit.builder()
        .user(user)
        .name(request.getName())
        .isActive(false)
        .build();

    TrainingSplit savedSplit = trainingSplitRepository.save(split);
    return toResponse(savedSplit);
  }

  @Transactional
  public SplitResponse updateSplit(Long splitId, UpdateSplitRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Split not found"));

    split.setName(request.getName());
    if (request.getCurrentBlock() != null) {
      if (request.getCurrentBlock() < 1 || request.getCurrentBlock() > 3)
        throw new BadRequestException("Block must be 1, 2, or 3");
      split.setCurrentBlock(request.getCurrentBlock());
    }
    applyMesocycle(split, request.getMesocycleWeeks(), request.getMesocycleStartDate());

    TrainingSplit updatedSplit = trainingSplitRepository.save(split);
    return toResponse(updatedSplit);
  }

  /** Starts the split's mesocycle over: the given day (the client's today) begins week 1. */
  @Transactional
  public SplitResponse restartMesocycle(Long splitId, RestartMesocycleRequest request, Authentication authentication) {
    User user = currentUser.get(authentication);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Split not found"));
    if (split.getMesocycleWeeks() == null) {
      throw new BadRequestException("This split has no mesocycle");
    }
    LocalDate start = request != null ? request.getStartDate() : null;
    split.setMesocycleStartDate(start != null ? start : LocalDate.now());

    return toResponse(trainingSplitRepository.save(split));
  }

  // Null leaves a field as it is, so clients that don't know about mesocycles can't turn one off
  private void applyMesocycle(TrainingSplit split, Integer weeks, LocalDate startDate) {
    if (weeks != null) {
      if (weeks == 0) {
        split.setMesocycleWeeks(null);
        split.setMesocycleStartDate(null);
        return;
      }
      if (weeks < Mesocycle.MIN_WEEKS || weeks > Mesocycle.MAX_WEEKS) {
        throw new BadRequestException(
            "A mesocycle must be " + Mesocycle.MIN_WEEKS + " to " + Mesocycle.MAX_WEEKS + " weeks long");
      }
      split.setMesocycleWeeks(weeks);
      if (split.getMesocycleStartDate() == null && startDate == null) {
        split.setMesocycleStartDate(LocalDate.now());
      }
    }
    if (startDate != null) {
      if (split.getMesocycleWeeks() == null) {
        throw new BadRequestException("Set a mesocycle length first");
      }
      split.setMesocycleStartDate(startDate);
    }
  }

  @Transactional
  public void deleteSplit(Long splitId, Authentication authentication) {
    User user = currentUser.get(authentication);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Split not found"));

    trainingSplitRepository.delete(split);
  }

  @Transactional
  public SplitResponse activateSplit(Long splitId, Authentication authentication) {
    User user = currentUser.get(authentication);

    List<TrainingSplit> allSplits = trainingSplitRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    allSplits.forEach(s -> s.setIsActive(false));
    trainingSplitRepository.saveAll(allSplits);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Split not found"));

    split.setIsActive(true);
    TrainingSplit activatedSplit = trainingSplitRepository.save(split);

    return toResponse(activatedSplit);
  }

  public SplitResponse getActiveSplit(Authentication authentication) {
    User user = currentUser.get(authentication);

    TrainingSplit activeSplit = trainingSplitRepository.findByUserIdAndIsActiveTrue(user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("No active split found"));

    return toResponse(activeSplit);
  }

  private SplitResponse toResponse(TrainingSplit split) {
    return SplitResponse.builder()
        .id(split.getId())
        .name(split.getName())
        .isActive(split.getIsActive())
        .currentBlock(split.getCurrentBlock())
        .mesocycleWeeks(split.getMesocycleWeeks())
        .mesocycleStartDate(split.getMesocycleStartDate())
        .workoutCount(split.getWorkouts().size())
        .createdAt(split.getCreatedAt())
        .updatedAt(split.getUpdatedAt())
        .build();
  }
}