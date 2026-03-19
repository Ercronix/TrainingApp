import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

type UseElapsedSecondsParams = {
  startedAt?: string | null;
  completedAt?: string | null;
  durationSeconds?: number | null;
};

export function useElapsedSeconds({ startedAt, completedAt, durationSeconds }: UseElapsedSecondsParams) {
  const startMs = useMemo(() => (startedAt ? Date.parse(startedAt) : Number.NaN), [startedAt]);
  const endMs = useMemo(() => (completedAt ? Date.parse(completedAt) : Number.NaN), [completedAt]);

  const [nowMs, setNowMs] = useState(() => Date.now());

  const isRunning =
    Number.isFinite(startMs) &&
    !Number.isFinite(endMs) &&
    (durationSeconds == null);

  useEffect(() => {
    if (!isRunning) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNowMs(Date.now());
    });
    return () => sub.remove();
  }, [isRunning]);

  if (!Number.isFinite(startMs)) return null;
  if (durationSeconds != null) return durationSeconds;
  if (Number.isFinite(endMs)) return Math.max(0, Math.floor((endMs - startMs) / 1000));

  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}

