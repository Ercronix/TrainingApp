const DAY_MS = 86_400_000;

const startOfDay = (time: number) => {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "today", "yesterday", "3 days ago", "2 weeks ago" for a past time, counted in calendar days. */
export function formatDaysAgo(time: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(time)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks} weeks ago`;
  return new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
