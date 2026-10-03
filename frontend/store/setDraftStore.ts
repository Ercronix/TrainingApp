import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SetRow {
  weight: string;
  reps: string;
  rpe: string;
  warmup: boolean;
  /** Finished this session. Once any row is checked, only checked rows are saved. */
  done: boolean;
}

export interface SetDraft {
  rows: SetRow[];
  /** Stopwatch of the timed set in progress; an absolute start, so it keeps counting while away. */
  timing: { index: number; startedAt: number } | null;
}

interface SetDraftState {
  /** Unsaved state of the log exercise screen, by exercise log id, kept across leaving the screen and app restarts. */
  drafts: Record<string, SetDraft>;
  setDraft: (exerciseLogId: string, draft: SetDraft) => void;
  /** Drops the drafts of a session's exercises once it's completed. */
  clearDrafts: (exerciseLogIds: string[]) => void;
  reset: () => void;
}

export const useSetDraftStore = create<SetDraftState>()(
  persist(
    (set) => ({
      drafts: {},

      setDraft: (exerciseLogId, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [exerciseLogId]: draft } })),

      clearDrafts: (exerciseLogIds) =>
        set((state) => {
          const drafts = { ...state.drafts };
          for (const id of exerciseLogIds) delete drafts[id];
          return { drafts };
        }),

      reset: () => set({ drafts: {} }),
    }),
    {
      name: 'set-drafts',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ drafts: state.drafts }),
    },
  ),
);
