package de.mornhinweg.trainingbackend.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class MesocycleTest {

  private static final LocalDate START = LocalDate.of(2026, 3, 2);

  @Test
  void weeksCountInSevenDayStepsFromTheStart() {
    assertThat(Mesocycle.weekOf(5, START, START)).contains(new Mesocycle.Week(1, 5, 1, false));
    assertThat(Mesocycle.weekOf(5, START, START.plusDays(6))).contains(new Mesocycle.Week(1, 5, 1, false));
    assertThat(Mesocycle.weekOf(5, START, START.plusDays(7))).contains(new Mesocycle.Week(2, 5, 1, false));
  }

  @Test
  void theLastWeekIsTheDeload() {
    assertThat(Mesocycle.weekOf(5, START, START.plusWeeks(4))).contains(new Mesocycle.Week(5, 5, 1, true));
    assertThat(Mesocycle.weekOf(5, START, START.plusWeeks(4).plusDays(6))).contains(new Mesocycle.Week(5, 5, 1, true));
    assertThat(Mesocycle.isDeload(5, START, START.plusWeeks(4))).isTrue();
    assertThat(Mesocycle.isDeload(5, START, START.plusWeeks(3))).isFalse();
  }

  @Test
  void theNextCycleStartsAfterTheDeload() {
    assertThat(Mesocycle.weekOf(5, START, START.plusWeeks(5))).contains(new Mesocycle.Week(1, 5, 2, false));
    assertThat(Mesocycle.weekOf(4, START, START.plusWeeks(11))).contains(new Mesocycle.Week(4, 4, 3, true));
  }

  @Test
  void noWeekWithoutACycleOrBeforeItStarts() {
    assertThat(Mesocycle.weekOf(null, START, START)).isEmpty();
    assertThat(Mesocycle.weekOf(5, null, START)).isEmpty();
    assertThat(Mesocycle.weekOf(5, START, START.minusDays(1))).isEmpty();
    assertThat(Mesocycle.isDeload(null, null, START)).isFalse();
  }

  @Test
  void deloadHalvesTheSetsRoundingUp() {
    assertThat(Deload.sets(5)).isEqualTo(3);
    assertThat(Deload.sets(4)).isEqualTo(2);
    assertThat(Deload.sets(1)).isEqualTo(1);
    assertThat(Deload.sets(0)).isZero();
    assertThat(Deload.sets(null)).isNull();
  }

  @Test
  void deloadTakesNinetyPercentOfTheWeightToHalfAKilo() {
    assertThat(Deload.weight(new BigDecimal("100"))).isEqualByComparingTo("90");
    assertThat(Deload.weight(new BigDecimal("62.5"))).isEqualByComparingTo("56.5");
    assertThat(Deload.weight(new BigDecimal("20"))).isEqualByComparingTo("18");
    assertThat(Deload.weight(new BigDecimal("8"))).isEqualByComparingTo("7");
    assertThat(Deload.weight(null)).isNull();
  }
}
