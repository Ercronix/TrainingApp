package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.stretch.ReorderStretchItemsRequest;
import de.mornhinweg.trainingbackend.dto.stretch.StretchItemRequest;
import de.mornhinweg.trainingbackend.dto.stretch.StretchItemResponse;
import de.mornhinweg.trainingbackend.dto.stretch.StretchRoutineResponse;
import de.mornhinweg.trainingbackend.dto.stretch.UpdateStretchRoutineRequest;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.exception.ResourceNotFoundException;
import de.mornhinweg.trainingbackend.model.StretchItem;
import de.mornhinweg.trainingbackend.model.StretchRoutine;
import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.StretchCheckInRepository;
import de.mornhinweg.trainingbackend.repository.StretchItemRepository;
import de.mornhinweg.trainingbackend.repository.StretchRoutineRepository;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * The user's stretch routine and the days they stretched. Nothing here touches the training
 * data, so stretches never show up in volume or other stats.
 */
@Service
@RequiredArgsConstructor
public class StretchService {

  static final String DEFAULT_ROUTINE_NAME = "Daily stretch";

  private final StretchRoutineRepository routineRepository;
  private final StretchItemRepository itemRepository;
  private final StretchCheckInRepository checkInRepository;
  private final UserRepository userRepository;

  @Transactional
  public StretchRoutineResponse getRoutine(Authentication authentication) {
    return toResponse(getOrCreateRoutine(getCurrentUser(authentication)));
  }

  @Transactional
  public StretchRoutineResponse updateRoutine(UpdateStretchRoutineRequest request, Authentication authentication) {
    StretchRoutine routine = getOrCreateRoutine(getCurrentUser(authentication));
    routine.setName(request.getName().trim());
    return toResponse(routineRepository.save(routine));
  }

  @Transactional
  public StretchItemResponse addItem(StretchItemRequest request, Authentication authentication) {
    StretchRoutine routine = getOrCreateRoutine(getCurrentUser(authentication));
    if (request.getName() == null || request.getName().isBlank()) {
      throw new BadRequestException("Stretch name is required");
    }
    if (request.getKind() == null || request.getAmount() == null) {
      throw new BadRequestException("Stretch kind and amount are required");
    }
    int nextIndex = routine.getItems().stream().mapToInt(StretchItem::getOrderIndex).max().orElse(-1) + 1;
    StretchItem item = StretchItem.builder()
        .routine(routine)
        .name(request.getName().trim())
        .kind(request.getKind())
        .amount(request.getAmount())
        .perSide(Boolean.TRUE.equals(request.getPerSide()))
        .note(blankToNull(request.getNote()))
        .orderIndex(nextIndex)
        .build();
    routine.getItems().add(item);
    return StretchItemResponse.from(itemRepository.save(item));
  }

  @Transactional
  public StretchItemResponse updateItem(Long id, StretchItemRequest request, Authentication authentication) {
    StretchItem item = getOwnedItem(id, getCurrentUser(authentication));
    if (request.getName() != null) {
      if (request.getName().isBlank()) throw new BadRequestException("Stretch name is required");
      item.setName(request.getName().trim());
    }
    if (request.getKind() != null) item.setKind(request.getKind());
    if (request.getAmount() != null) item.setAmount(request.getAmount());
    if (request.getPerSide() != null) item.setPerSide(request.getPerSide());
    // An empty note clears it
    if (request.getNote() != null) item.setNote(blankToNull(request.getNote()));
    return StretchItemResponse.from(itemRepository.save(item));
  }

  @Transactional
  public void deleteItem(Long id, Authentication authentication) {
    StretchItem item = getOwnedItem(id, getCurrentUser(authentication));
    item.getRoutine().getItems().remove(item);
    itemRepository.delete(item);
  }

  @Transactional
  public void reorderItems(ReorderStretchItemsRequest request, Authentication authentication) {
    if (request.getItems() == null) throw new BadRequestException("Items are required");
    StretchRoutine routine = getOrCreateRoutine(getCurrentUser(authentication));
    Map<Long, Integer> order = request.getItems().stream()
        .filter(i -> i.getId() != null && i.getOrderIndex() != null)
        .collect(Collectors.toMap(ReorderStretchItemsRequest.ItemOrder::getId,
            ReorderStretchItemsRequest.ItemOrder::getOrderIndex, (a, b) -> b));
    // Ids of other users' items are ignored, since only this routine's items are looked up
    for (StretchItem item : routine.getItems()) {
      Integer index = order.get(item.getId());
      if (index != null) item.setOrderIndex(index);
    }
    routineRepository.save(routine);
  }

  public List<LocalDate> getCheckIns(Authentication authentication) {
    return checkInRepository.findDaysByUserId(getCurrentUser(authentication).getId());
  }

  @Transactional
  public void checkIn(LocalDate day, Authentication authentication) {
    // The client sends its own date, which runs at most a day ahead of the server's
    if (day.isAfter(LocalDate.now().plusDays(1))) {
      throw new BadRequestException("Can't check in a day in the future");
    }
    checkInRepository.insertIgnoringDuplicate(getCurrentUser(authentication).getId(), day);
  }

  @Transactional
  public void undoCheckIn(LocalDate day, Authentication authentication) {
    checkInRepository.deleteByUserIdAndDay(getCurrentUser(authentication).getId(), day);
  }

  private StretchRoutine getOrCreateRoutine(User user) {
    return routineRepository.findByUserId(user.getId())
        .orElseGet(() -> routineRepository.save(
            StretchRoutine.builder().user(user).name(DEFAULT_ROUTINE_NAME).build()));
  }

  private StretchItem getOwnedItem(Long id, User user) {
    return itemRepository.findByIdAndRoutineUserId(id, user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Stretch not found"));
  }

  private User getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }

  private static String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  private StretchRoutineResponse toResponse(StretchRoutine routine) {
    return StretchRoutineResponse.builder()
        .id(routine.getId())
        .name(routine.getName())
        .items(routine.getItems().stream().map(StretchItemResponse::from).toList())
        .build();
  }
}
