package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.split.CreateSplitRequest;
import de.mornhinweg.trainingbackend.dto.split.SplitResponse;
import de.mornhinweg.trainingbackend.dto.split.UpdateSplitRequest;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.TrainingSplit;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.TrainingSplitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        throw new RuntimeException("Block must be 1, 2, or 3");
      split.setCurrentBlock(request.getCurrentBlock());
    }

    TrainingSplit updatedSplit = trainingSplitRepository.save(split);
    return toResponse(updatedSplit);
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
        .workoutCount(split.getWorkouts().size())
        .createdAt(split.getCreatedAt())
        .updatedAt(split.getUpdatedAt())
        .build();
  }
}