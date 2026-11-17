import {
  formatMesocycleWeek, mesocycleWeek, shiftDay, splitMesocycleWeek, startDateForWeek,
} from '@/utils/mesocycle';

describe('mesocycleWeek', () => {
  const START = '2026-03-02';

  it('counts weeks in 7-day steps from the start', () => {
    expect(mesocycleWeek(5, START, START)).toEqual({ week: 1, length: 5, cycle: 1, deload: false });
    expect(mesocycleWeek(5, START, '2026-03-08')).toMatchObject({ week: 1 });
    expect(mesocycleWeek(5, START, '2026-03-09')).toMatchObject({ week: 2 });
    expect(mesocycleWeek(5, START, '2026-03-18')).toMatchObject({ week: 3, deload: false });
  });

  it('makes the last week the deload', () => {
    expect(mesocycleWeek(5, START, '2026-03-30')).toEqual({ week: 5, length: 5, cycle: 1, deload: true });
    expect(mesocycleWeek(5, START, '2026-04-05')).toMatchObject({ week: 5, deload: true });
  });

  it('starts the next cycle after the deload', () => {
    expect(mesocycleWeek(5, START, '2026-04-06')).toEqual({ week: 1, length: 5, cycle: 2, deload: false });
    expect(mesocycleWeek(4, START, shiftDay(START, 11 * 7))).toEqual({ week: 4, length: 4, cycle: 3, deload: true });
  });

  it('is not thrown off by a DST change', () => {
    // Europe switches to summer time on 2026-03-29
    expect(mesocycleWeek(6, '2026-03-23', '2026-03-30')).toMatchObject({ week: 2 });
    expect(mesocycleWeek(6, '2026-10-19', '2026-10-26')).toMatchObject({ week: 2 });
  });

  it('is null without a mesocycle, before it starts or for a malformed date', () => {
    expect(mesocycleWeek(null, START, START)).toBeNull();
    expect(mesocycleWeek(0, START, START)).toBeNull();
    expect(mesocycleWeek(5, null, START)).toBeNull();
    expect(mesocycleWeek(5, START, '2026-03-01')).toBeNull();
    expect(mesocycleWeek(5, 'soon', START)).toBeNull();
  });

  it('reads a split', () => {
    expect(splitMesocycleWeek({ mesocycleWeeks: 4, mesocycleStartDate: START }, '2026-03-23')).toMatchObject({ week: 4, deload: true });
    expect(splitMesocycleWeek({ mesocycleWeeks: null, mesocycleStartDate: null }, START)).toBeNull();
    // Splits cached before mesocycles existed
    expect(splitMesocycleWeek({}, START)).toBeNull();
    expect(splitMesocycleWeek(undefined, START)).toBeNull();
  });
});

describe('shiftDay', () => {
  it('moves across months and years', () => {
    expect(shiftDay('2026-03-02', -2)).toBe('2026-02-28');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('startDateForWeek', () => {
  it('counts back from today without a start date', () => {
    expect(startDateForWeek(1, '2026-11-17')).toBe('2026-11-17');
    expect(startDateForWeek(3, '2026-11-17')).toBe('2026-11-03');
  });

  it('keeps the weekday the weeks turn over on', () => {
    // Started on a Monday; today is the Wednesday of week 2
    const start = startDateForWeek(4, '2026-11-18', '2026-11-09');
    expect(start).toBe('2026-10-26');
    expect(mesocycleWeek(5, start, '2026-11-18')).toMatchObject({ week: 4 });
    expect(mesocycleWeek(5, start, '2026-11-23')).toMatchObject({ week: 5, deload: true });
  });

  it('puts today in the chosen week', () => {
    for (let week = 1; week <= 6; week++) {
      expect(mesocycleWeek(6, startDateForWeek(week, '2026-11-17', '2026-08-01'), '2026-11-17')).toMatchObject({ week });
    }
  });

  it('ignores a start date in the future', () => {
    expect(startDateForWeek(2, '2026-11-17', '2026-12-01')).toBe('2026-11-10');
  });
});

describe('formatMesocycleWeek', () => {
  it('names the week or the deload', () => {
    expect(formatMesocycleWeek({ week: 3, length: 5, cycle: 1, deload: false })).toBe('WEEK 3 OF 5');
    expect(formatMesocycleWeek({ week: 5, length: 5, cycle: 1, deload: true })).toBe('DELOAD WEEK');
  });
});
