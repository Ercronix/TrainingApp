import { useEffect, useState } from 'react';
import { SetDraft, SetRow, useSetDraftStore } from '@/store/setDraftStore';
import { restorableDraft } from '@/utils/logExercise';
import { ExerciseLog } from '@/types';

/**
 * The state the log exercise screen was left in on an earlier visit, read once on open; it wins
 * over the prefill unless the server's sets have moved on since (see `restorableDraft`).
 */
export function useRestoredDraft(exerciseLogId: string, log: ExerciseLog | undefined): SetDraft | undefined {
  const [draft] = useState(() => restorableDraft(useSetDraftStore.getState().drafts[exerciseLogId], log));
  return draft;
}

/** Keeps the screen's rows and stopwatch in the persisted draft store, across leaving the screen and app restarts. */
export function usePersistDraft(exerciseLogId: string, rows: SetRow[], timing: SetDraft['timing']) {
  useEffect(() => {
    useSetDraftStore.getState().setDraft(exerciseLogId, { rows, timing });
  }, [exerciseLogId, rows, timing]);
}
