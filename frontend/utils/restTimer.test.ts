import { formatOvertime, formatRestClock, formatRestLength, isRestRunning, restStatus } from '@/utils/restTimer';

describe('restStatus', () => {
  const end = 1_000_000;

  it('is idle with the seconds left while stopped or paused', () => {
    expect(restStatus(null, 90, end)).toEqual({ phase: 'idle', seconds: 90 });
    expect(restStatus(null, 0, end)).toEqual({ phase: 'idle', seconds: 0 });
  });

  it('rounds the seconds left up while running, so it never shows 0 before the end', () => {
    expect(restStatus(end, 120, end - 120_000)).toEqual({ phase: 'running', seconds: 120 });
    expect(restStatus(end, 120, end - 59_001)).toEqual({ phase: 'running', seconds: 60 });
    expect(restStatus(end, 120, end - 1)).toEqual({ phase: 'running', seconds: 1 });
  });

  it('is over from the end time on and counts the overtime in whole seconds', () => {
    expect(restStatus(end, 120, end)).toEqual({ phase: 'over', seconds: 0 });
    expect(restStatus(end, 120, end + 999)).toEqual({ phase: 'over', seconds: 0 });
    expect(restStatus(end, 120, end + 42_500)).toEqual({ phase: 'over', seconds: 42 });
  });

  it('counts the overtime of a rest that ended while the app was in the background', () => {
    expect(restStatus(end, 120, end + 15 * 60_000 + 3_000)).toEqual({ phase: 'over', seconds: 903 });
  });
});

describe('isRestRunning', () => {
  it('is true only before the end time', () => {
    expect(isRestRunning(null, 0)).toBe(false);
    expect(isRestRunning(1000, 999)).toBe(true);
    expect(isRestRunning(1000, 1000)).toBe(false);
    expect(isRestRunning(1000, 5000)).toBe(false);
  });
});

describe('formatting', () => {
  it('formats the countdown with two-digit minutes', () => {
    expect(formatRestClock(0)).toBe('00:00');
    expect(formatRestClock(90)).toBe('01:30');
    expect(formatRestClock(605)).toBe('10:05');
  });

  it('formats a rest length without a leading zero', () => {
    expect(formatRestLength(45)).toBe('0:45');
    expect(formatRestLength(150)).toBe('2:30');
  });

  it('formats the overtime with a plus sign', () => {
    expect(formatOvertime(0)).toBe('+0:00');
    expect(formatOvertime(42)).toBe('+0:42');
    expect(formatOvertime(725)).toBe('+12:05');
    expect(formatOvertime(3661)).toBe('+61:01');
  });
});
