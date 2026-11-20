package de.mornhinweg.trainingbackend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** How a deload session lowers the planned targets. The factors live here and only here. */
public final class Deload {

  /** Share of the planned working sets, rounded up (so at least one set stays). */
  public static final double SET_FACTOR = 0.5;
  /** Share of the planned weight. */
  public static final BigDecimal WEIGHT_FACTOR = new BigDecimal("0.9");
  /** Deload weights are rounded to this step, in kg. */
  public static final BigDecimal WEIGHT_STEP = new BigDecimal("0.5");

  private Deload() {}

  public static Integer sets(Integer planned) {
    if (planned == null || planned <= 0) return planned;
    return (int) Math.ceil(planned * SET_FACTOR);
  }

  public static BigDecimal weight(BigDecimal planned) {
    if (planned == null) return null;
    BigDecimal steps = planned.multiply(WEIGHT_FACTOR).divide(WEIGHT_STEP, 0, RoundingMode.HALF_UP);
    return steps.multiply(WEIGHT_STEP).setScale(2, RoundingMode.HALF_UP);
  }
}
