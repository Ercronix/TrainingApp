import { useEffect, useRef, useState } from 'react';
import { SetDraft, SetRow } from '@/store/setDraftStore';
import { elapsedSeconds, reachedTarget, RowDefaults, timedTargetSeconds } from '@/utils/logExercise';
import { haptics } from '@/utils/haptics';

/**
 * Stopwatch of the set being performed, for timed exercises. `timing` is an absolute start, so
 * it keeps counting while away; pass the restored draft's to pick it up again. Buzzes once when
 * the set reaches its target.
 */
export function useTimedSet(restored: SetDraft['timing'] | undefined, rows: SetRow[], defaults: RowDefaults) {
  const [timing, setTiming] = useState<SetDraft['timing']>(restored ?? null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  // A stopwatch restored past its target already buzzed (or ran out while away). On the first
  // render `rows` are still the restored draft's, which the target is read from.
  const buzzed = useRef(reachedTarget(restored ?? null, rows, defaults, Date.now()));
  const elapsed = timing ? elapsedSeconds(timing.startedAt, nowMs) : 0;

  useEffect(() => {
    if (!timing) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(timer);
  }, [timing]);

  // Through haptics, so the Profile switch applies
  const target = timing ? timedTargetSeconds(rows, timing.index, defaults) : NaN;
  useEffect(() => {
    if (timing && !buzzed.current && target > 0 && elapsed >= target) {
      buzzed.current = true;
      haptics.success();
    }
  }, [timing, elapsed, target]);

  const start = (index: number) => {
    haptics.tap();
    buzzed.current = false;
    setTiming({ index, startedAt: Date.now() });
  };

  /** Stops the stopwatch without logging anything; read `elapsed` first to keep the time held. */
  const stop = () => setTiming(null);

  return { timing, elapsed, start, stop };
}
