package de.mornhinweg.trainingbackend.service;

import de.mornhinweg.trainingbackend.exception.BadRequestException;

/** A planned exercise's rep range: {@code reps} is its bottom and {@code repsMax} its top. */
final class RepRanges {

  private RepRanges() {
  }

  /**
   * The top to store for a plan of {@code reps} up to {@code repsMax}: null for a fixed rep count
   * (no top, 0, or the same as the bottom). Throws when the top is below the bottom or there is no
   * bottom.
   */
  static Integer topOf(Integer reps, Integer repsMax) {
    if (repsMax == null || repsMax == 0) return null;
    if (repsMax < 0) {
      throw new BadRequestException("The top of the rep range can't be negative");
    }
    if (reps == null) {
      throw new BadRequestException("A rep range needs a minimum");
    }
    if (repsMax < reps) {
      throw new BadRequestException("The top of the rep range (" + repsMax + ") is below its minimum (" + reps + ")");
    }
    return repsMax.equals(reps) ? null : repsMax;
  }
}
