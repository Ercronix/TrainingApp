package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.dto.bodyweight.BodyWeightRequest;
import de.mornhinweg.trainingbackend.dto.bodyweight.BodyWeightResponse;
import de.mornhinweg.trainingbackend.exception.BadRequestException;
import de.mornhinweg.trainingbackend.model.BodyWeightEntry;
import de.mornhinweg.trainingbackend.repository.BodyWeightEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * The user's body weight log: one entry per day, keyed by the client's local date. Every query is
 * scoped to the signed-in user, so a date never reaches another user's entry.
 */
@Service
@RequiredArgsConstructor
public class BodyWeightService {

  private final BodyWeightEntryRepository entryRepository;
  private final CurrentUserService currentUser;

  /** Entries in ascending date order, optionally limited to [from, to] (either end may be open). */
  @Transactional(readOnly = true)
  public List<BodyWeightResponse> getEntries(LocalDate from, LocalDate to, Authentication authentication) {
    Long userId = currentUser.get(authentication).getId();
    if (from != null && to != null && from.isAfter(to)) {
      throw new BadRequestException("'from' must not be after 'to'");
    }
    List<BodyWeightEntry> entries = from == null && to == null
        ? entryRepository.findByUserIdOrderByDayAsc(userId)
        : entryRepository.findByUserIdAndDayBetweenOrderByDayAsc(userId,
            from != null ? from : LocalDate.of(1900, 1, 1),
            to != null ? to : LocalDate.of(9999, 12, 31));
    return entries.stream().map(BodyWeightResponse::from).toList();
  }

  /** Logs the weight for a day, replacing that day's entry if there is one. */
  @Transactional
  public BodyWeightResponse upsert(LocalDate day, BodyWeightRequest request, Authentication authentication) {
    // The client sends its own date, which runs at most a day ahead of the server's
    if (day.isAfter(LocalDate.now().plusDays(1))) {
      throw new BadRequestException("Can't log a weight for a day in the future");
    }
    Long userId = currentUser.get(authentication).getId();
    entryRepository.upsert(userId, day, request.getWeight(), blankToNull(request.getNote()));
    return entryRepository.findByUserIdAndDay(userId, day)
        .map(BodyWeightResponse::from)
        .orElseThrow(() -> new IllegalStateException("Body weight entry missing after upsert"));
  }

  /** Removes the day's entry. Idempotent, so a replayed offline delete succeeds too. */
  @Transactional
  public void delete(LocalDate day, Authentication authentication) {
    entryRepository.deleteByUserIdAndDay(currentUser.get(authentication).getId(), day);
  }

  private static String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
