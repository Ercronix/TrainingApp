import { formatDaysAgo } from '@/utils/dates';
import { local } from '@/test/factories';

describe('formatDaysAgo', () => {
  const now = local(2026, 11, 18, 9).getTime();
  const ago = (...date: Parameters<typeof local>) => formatDaysAgo(local(...date).getTime(), now);

  it('counts calendar days, not 24-hour spans', () => {
    expect(ago(2026, 11, 18, 0, 1)).toBe('today');
    expect(ago(2026, 11, 17, 23, 59)).toBe('yesterday');
    expect(ago(2026, 11, 17, 0, 0)).toBe('yesterday');
    expect(ago(2026, 11, 16, 23, 0)).toBe('2 days ago');
  });

  it('treats a time later today or in the future as today', () => {
    expect(ago(2026, 11, 18, 22)).toBe('today');
    expect(ago(2026, 11, 20)).toBe('today');
  });

  it('switches to weeks after 13 days', () => {
    expect(ago(2026, 11, 5)).toBe('13 days ago');
    expect(ago(2026, 11, 4)).toBe('2 weeks ago');
    expect(ago(2026, 10, 1)).toBe('6 weeks ago');
    expect(ago(2026, 9, 17)).toBe('8 weeks ago'); // 62 days
  });

  it('counts days correctly across a daylight saving change', () => {
    // 25 Oct 2026 has 25 hours in Europe
    expect(formatDaysAgo(local(2026, 10, 24, 12).getTime(), local(2026, 10, 26, 12).getTime())).toBe('2 days ago');
  });

  it('shows the date from nine weeks on', () => {
    const time = local(2026, 9, 16).getTime(); // 63 days
    expect(formatDaysAgo(time, now)).toBe(new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
    expect(formatDaysAgo(time, now)).not.toMatch(/ago/);
  });
});
