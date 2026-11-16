import { StretchItem } from '@/types';
import {
  addDays,
  formatAmount,
  formatClock,
  localDay,
  routineSeconds,
  sessionSteps,
  stretchStreak,
  weekDays,
} from '@/utils/stretch';
import { local } from '@/test/factories';

const item = (kind: StretchItem['kind'], amount: number, perSide = false, id = 1): StretchItem =>
  ({ id, name: `Stretch ${id}`, kind, amount, perSide, note: null, orderIndex: id });

describe('localDay', () => {
  it('formats the local calendar date with zero padding', () => {
    expect(localDay(local(2026, 3, 5, 0, 0))).toBe('2026-03-05');
    expect(localDay(local(2026, 12, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('addDays', () => {
  it('moves by calendar days across months and years', () => {
    expect(localDay(addDays(local(2026, 1, 31), 1))).toBe('2026-02-01');
    expect(localDay(addDays(local(2026, 1, 1), -1))).toBe('2025-12-31');
  });

  it('keeps the time of day across a daylight saving change', () => {
    const before = local(2026, 10, 24, 12);
    const after = addDays(before, 2);
    expect(localDay(after)).toBe('2026-10-26');
    expect(after.getHours()).toBe(12);
  });

  it('does not change the original date', () => {
    const date = local(2026, 11, 18);
    addDays(date, 5);
    expect(localDay(date)).toBe('2026-11-18');
  });
});

describe('stretchStreak', () => {
  const today = local(2026, 11, 18, 20);
  const days = (...list: string[]) => new Set(list);

  it('is zero without check-ins or with a gap before yesterday', () => {
    expect(stretchStreak(days(), today)).toBe(0);
    expect(stretchStreak(days('2026-11-16', '2026-11-15'), today)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(stretchStreak(days('2026-11-18', '2026-11-17', '2026-11-16', '2026-11-14'), today)).toBe(3);
  });

  it('stays alive from yesterday while today is still open', () => {
    expect(stretchStreak(days('2026-11-17', '2026-11-16'), today)).toBe(2);
  });

  it('runs across month boundaries and DST changes', () => {
    const start = local(2026, 11, 2);
    const list = Array.from({ length: 10 }, (_, i) => localDay(addDays(start, -i)));
    expect(stretchStreak(new Set(list), start)).toBe(10);
    // 25 Oct 2026 (end of DST in Europe) is part of the run
    expect(list).toContain('2026-10-25');
  });
});

describe('routineSeconds', () => {
  it('adds holds, estimates reps and doubles per-side stretches', () => {
    expect(routineSeconds([])).toBe(0);
    expect(routineSeconds([item('hold', 30)])).toBe(30);
    expect(routineSeconds([item('hold', 30, true)])).toBe(60);
    expect(routineSeconds([item('reps', 10)])).toBe(40);
    expect(routineSeconds([item('reps', 10, true), item('hold', 45)])).toBe(80 + 45);
  });
});

describe('formatClock', () => {
  it('formats minutes and padded seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(45)).toBe('0:45');
    expect(formatClock(510)).toBe('8:30');
    expect(formatClock(3600)).toBe('60:00');
  });

  it('rounds and clamps at zero', () => {
    expect(formatClock(59.6)).toBe('1:00');
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('formatAmount', () => {
  it('formats holds in seconds, or as a clock from a minute on', () => {
    expect(formatAmount({ kind: 'hold', amount: 30 })).toBe('30s');
    expect(formatAmount({ kind: 'hold', amount: 59 })).toBe('59s');
    expect(formatAmount({ kind: 'hold', amount: 60 })).toBe('1:00');
    expect(formatAmount({ kind: 'hold', amount: 90 })).toBe('1:30');
  });

  it('formats reps with a singular', () => {
    expect(formatAmount({ kind: 'reps', amount: 1 })).toBe('1 rep');
    expect(formatAmount({ kind: 'reps', amount: 10 })).toBe('10 reps');
  });
});

describe('sessionSteps', () => {
  it('splits per-side stretches into left then right', () => {
    const a = item('hold', 30, false, 1);
    const b = item('hold', 30, true, 2);
    expect(sessionSteps([a, b])).toEqual([
      { item: a, side: null },
      { item: b, side: 'left' },
      { item: b, side: 'right' },
    ]);
    expect(sessionSteps([])).toEqual([]);
  });
});

describe('weekDays', () => {
  const days = (date: Date) => weekDays(date).map(localDay);

  it('lists Monday to Sunday at midnight', () => {
    const week = weekDays(local(2026, 11, 18, 15));
    expect(week.map(localDay)).toEqual([
      '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22',
    ]);
    expect(week.every((d) => d.getHours() === 0 && d.getMinutes() === 0)).toBe(true);
  });

  it('treats Sunday as the end of the week', () => {
    expect(days(local(2026, 11, 22, 23, 59))[0]).toBe('2026-11-16');
    expect(days(local(2026, 11, 16, 0, 0))[0]).toBe('2026-11-16');
  });

  it('spans month boundaries', () => {
    expect(days(local(2026, 12, 31))).toEqual([
      '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
    ]);
  });
});
