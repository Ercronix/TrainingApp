package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.split.CreateSplitRequest;
import de.mornhinweg.trainingbackend.dto.split.SplitResponse;
import de.mornhinweg.trainingbackend.dto.split.UpdateSplitRequest;
import de.mornhinweg.trainingbackend.model.TrainingSplit;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.TrainingSplitRepository;
import de.mornhinweg.trainingbackend.repository.UserRepository;
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
  private final UserRepository userRepository;

  public List<SplitResponse> getAllSplits(Authentication authentication) {
    User user = getCurrentUser(authentication);

    return trainingSplitRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public SplitResponse createSplit(CreateSplitRequest request, Authentication authentication) {
    User user = getCurrentUser(authentication);

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
    User user = getCurrentUser(authentication);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new RuntimeException("Split not found"));

    split.setName(request.getName());

    TrainingSplit updatedSplit = trainingSplitRepository.save(split);
    return toResponse(updatedSplit);
  }

  @Transactional
  public void deleteSplit(Long splitId, Authentication authentication) {
    User user = getCurrentUser(authentication);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new RuntimeException("Split not found"));

    trainingSplitRepository.delete(split);
  }

  @Transactional
  public SplitResponse activateSplit(Long splitId, Authentication authentication) {
    User user = getCurrentUser(authentication);

    List<TrainingSplit> allSplits = trainingSplitRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    allSplits.forEach(s -> s.setIsActive(false));
    trainingSplitRepository.saveAll(allSplits);

    TrainingSplit split = trainingSplitRepository.findByIdAndUserId(splitId, user.getId())
        .orElseThrow(() -> new RuntimeException("Split not found"));

    split.setIsActive(true);
    TrainingSplit activatedSplit = trainingSplitRepository.save(split);

    return toResponse(activatedSplit);
  }

  public SplitResponse getActiveSplit(Authentication authentication) {
    User user = getCurrentUser(authentication);

    TrainingSplit activeSplit = trainingSplitRepository.findByUserIdAndIsActiveTrue(user.getId())
        .orElseThrow(() -> new RuntimeException("No active split found"));

    return toResponse(activeSplit);
  }

  private User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
  }

  private SplitResponse toResponse(TrainingSplit split) {
    return SplitResponse.builder()
        .id(split.getId())
        .name(split.getName())
        .isActive(split.getIsActive())
        .workoutCount(split.getWorkouts().size())
        .createdAt(split.getCreatedAt())
        .updatedAt(split.getUpdatedAt())
        .build();
  }
}