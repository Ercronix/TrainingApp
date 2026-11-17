import { useEffect, useRef } from 'react';
import { useExerciseLog } from './useExerciseLog';
import { keyOf, payloadFromKey, payloadOf, SAVE_DEBOUNCE_MS, savedKeyOf } from '@/utils/logExercise';
import { ExerciseLog, SetLog } from '@/types';

/**
 * Saves every change to the done sets of the log exercise screen, through the offline-safe
 * exercise log mutation. `doneSets` is null while a done set has invalid values: that holds the
 * save back, so it can't replace good sets on the server.
 *
 * Value edits wait for a pause, so a run of stepper taps becomes one request; call
 * `saveNextChangeNow` just before a change that should be saved at once (a set logged or
 * undone, a done one removed or switched to or from warm-up). A save still waiting when the
 * screen closes is sent then.
 */
export function useAutoSaveSets(
  exerciseLogId: string,
  trainingLogId: string,
  log: ExerciseLog | undefined,
  doneSets: SetLog[] | null,
) {
  const { saveSets } = useExerciseLog(exerciseLogId, trainingLogId);
  // What the server already has, so only real changes are sent
  const lastSaved = useRef(savedKeyOf(log));
  const saveNow = useRef(false);
  // A debounced save not sent yet; flushed when the screen closes
  const pending = useRef<string | null>(null);
  const saveSetsRef = useRef(saveSets);
  useEffect(() => { saveSetsRef.current = saveSets; }, [saveSets]);

  const payloadKey = doneSets == null ? null : keyOf(payloadOf(doneSets, log));

  useEffect(() => {
    const immediate = saveNow.current;
    saveNow.current = false;
    const save = (key: string) => {
      pending.current = null;
      if (key === lastSaved.current) return;
      lastSaved.current = key;
      const { sets, completed } = payloadFromKey(key);
      saveSetsRef.current(sets, completed);
    };
    if (payloadKey == null || payloadKey === lastSaved.current) {
      pending.current = null;
      return;
    }
    if (immediate) {
      save(payloadKey);
      return;
    }
    pending.current = payloadKey;
    const timer = setTimeout(() => save(payloadKey), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [payloadKey]);

  useEffect(() => () => {
    const key = pending.current;
    if (key == null || key === lastSaved.current) return;
    lastSaved.current = key;
    const { sets, completed } = payloadFromKey(key);
    saveSetsRef.current(sets, completed);
  }, []);

  const saveNextChangeNow = () => {
    saveNow.current = true;
  };

  /** Saves these sets as the exercise's, marked completed, unless the server has exactly that already. */
  const saveCompleted = (sets: SetLog[]) => {
    const key = keyOf({ sets, completed: true });
    pending.current = null;
    if (key !== lastSaved.current) {
      lastSaved.current = key;
      saveSetsRef.current(sets, true);
    }
  };

  return { saveNextChangeNow, saveCompleted };
}
