import { BodyWeightEntry } from '@/types';
import {
  changeOver,
  dayNumber,
  formatWeight,
  movingAverage,
  nearestEntry,
  parseWeight,
  relativeStrength,
  removeEntry,
  stepWeight,
  upsertEntry,
} from '@/utils/bodyWeight';
import { local } from '@/test/factories';

const entry = (date: string, weight: number, note: string | null = null, id?: number): BodyWeightEntry =>
  ({ id, date, weight, note });

describe('dayNumber', () => {
  it('counts calendar days, also across a DST change', () => {
    expect(dayNumber('2026-03-30') - dayNumber('2026-03-28')).toBe(2);
    expect(dayNumber('2026-11-01') - dayNumber('2026-10-24')).toBe(8);
    expect(dayNumber('2027-01-01') - dayNumber('2026-12-31')).toBe(1);
  });
});

describe('nearestEntry', () => {
  const entries = [entry('2026-03-01', 80), entry('2026-03-10', 82), entry('2026-03-20', 81)];

  it('is null without entries', () => {
    expect(nearestEntry([], local(2026, 3, 5).getTime())).toBeNull();
  });

  it('picks the entry on the same day', () => {
    expect(nearestEntry(entries, local(2026, 3, 10, 23, 30).getTime())?.weight).toBe(82);
  });

  it('picks the closest entry before or after', () => {
    expect(nearestEntry(entries, local(2026, 3, 3).getTime())?.date).toBe('2026-03-01');
    expect(nearestEntry(entries, local(2026, 3, 8).getTime())?.date).toBe('2026-03-10');
    expect(nearestEntry(entries, local(2025, 12, 1).getTime())?.date).toBe('2026-03-01');
    expect(nearestEntry(entries, local(2027, 1, 1).getTime())?.date).toBe('2026-03-20');
  });

  it('prefers the earlier entry on a tie, whatever the order', () => {
    expect(nearestEntry(entries, local(2026, 3, 15).getTime())?.date).toBe('2026-03-10');
    expect(nearestEntry([...entries].reverse(), local(2026, 3, 15).getTime())?.date).toBe('2026-03-10');
  });

  it('reads the time as a local calendar day, not by hours', () => {
    // 23:59 on the 5th is still 4 days from the 1st and 5 from the 10th
    const both = [entry('2026-03-01', 80), entry('2026-03-10', 82)];
    expect(nearestEntry(both, local(2026, 3, 5, 23, 59).getTime())?.date).toBe('2026-03-01');
  });
});

describe('relativeStrength', () => {
  const entries = [entry('2026-03-01', 80), entry('2026-06-01', 75)];

  it('divides the load by the nearest body weight', () => {
    const r = relativeStrength(120, local(2026, 3, 4).getTime(), entries);
    expect(r?.ratio).toBeCloseTo(1.5);
    expect(r?.bodyWeight.date).toBe('2026-03-01');
    expect(relativeStrength(150, local(2026, 5, 30).getTime(), entries)?.ratio).toBeCloseTo(2);
  });

  it('is null without body weight or without a load', () => {
    expect(relativeStrength(100, Date.now(), [])).toBeNull();
    expect(relativeStrength(0, Date.now(), entries)).toBeNull();
  });
});

describe('movingAverage', () => {
  it('averages the entries in the trailing calendar window', () => {
    const avg = movingAverage([
      entry('2026-03-01', 80),
      entry('2026-03-02', 82),
      entry('2026-03-07', 84),
      // 2026-03-01 drops out: the window is the 8th and the 6 days before it
      entry('2026-03-08', 86),
    ]);
    expect(avg.map((a) => a.date)).toEqual(['2026-03-01', '2026-03-02', '2026-03-07', '2026-03-08']);
    expect(avg.map((a) => a.value)).toEqual([80, 81, 82, 84]);
  });

  it('sorts unsorted input and handles gaps longer than the window', () => {
    const avg = movingAverage([entry('2026-04-01', 70), entry('2026-03-01', 80)], 7);
    expect(avg).toEqual([{ date: '2026-03-01', value: 80 }, { date: '2026-04-01', value: 70 }]);
  });

  it('is empty without entries', () => {
    expect(movingAverage([])).toEqual([]);
  });
});

describe('upsertEntry / removeEntry', () => {
  const entries = [entry('2026-03-01', 80, null, 1), entry('2026-03-05', 81, 'sick', 2)];

  it('adds a new date in order', () => {
    expect(upsertEntry(entries, entry('2026-03-03', 79)).map((e) => e.date))
      .toEqual(['2026-03-01', '2026-03-03', '2026-03-05']);
  });

  it('replaces the entry on the same date and keeps its id', () => {
    const next = upsertEntry(entries, entry('2026-03-05', 80.5));
    expect(next).toHaveLength(2);
    expect(next[1]).toEqual({ id: 2, date: '2026-03-05', weight: 80.5, note: null });
  });

  it('removes by date', () => {
    expect(removeEntry(entries, '2026-03-01')).toEqual([entries[1]]);
    expect(removeEntry(entries, '2026-01-01')).toEqual(entries);
  });
});

describe('parseWeight', () => {
  it('accepts dots and commas and rounds to two decimals', () => {
    expect(parseWeight('80')).toBe(80);
    expect(parseWeight(' 80.5 ')).toBe(80.5);
    expect(parseWeight('80,25')).toBe(80.25);
    expect(parseWeight('80.256')).toBe(80.26);
    expect(parseWeight('80.')).toBe(80);
  });

  it('rejects anything else', () => {
    for (const text of ['', ' ', 'abc', '-80', '0', '0.001', '1000', '80kg', '8.0.0']) {
      expect(parseWeight(text)).toBeNull();
    }
  });
});

describe('stepWeight', () => {
  it('steps on the 0.1 grid without float noise', () => {
    expect(stepWeight(80, 0.1)).toBe(80.1);
    expect(stepWeight(80.1, 0.1)).toBe(80.2);
    expect(stepWeight(80.25, -0.1)).toBe(80.2);
  });

  it('stays within the accepted range', () => {
    expect(stepWeight(0.1, -0.1)).toBe(0.1);
    expect(stepWeight(999.9, 0.5)).toBe(999.99);
  });
});

describe('formatWeight', () => {
  it('drops trailing zeros', () => {
    expect(formatWeight(80)).toBe('80');
    expect(formatWeight(80.5)).toBe('80.5');
    expect(formatWeight(80.25)).toBe('80.25');
  });
});

describe('changeOver', () => {
  it('compares the latest weight with the one about `days` earlier', () => {
    const entries = [entry('2026-02-01', 84), entry('2026-02-14', 83), entry('2026-03-01', 81), entry('2026-03-02', 80.5)];
    expect(changeOver(entries, 30)).toBeCloseTo(-3.5);
    expect(changeOver(entries, 7)).toBeNull();
  });

  it('is null without enough history', () => {
    expect(changeOver([], 30)).toBeNull();
    expect(changeOver([entry('2026-03-01', 80), entry('2026-03-08', 79)], 30)).toBeNull();
  });
});
