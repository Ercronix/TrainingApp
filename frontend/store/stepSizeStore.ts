import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_STEP_KG = 2.5;
export const STEP_INCREMENT_KG = 0.5;
const MAX_STEP_KG = 50;

interface StepSizeState {
  /** Weight stepper increment in kg, by library exercise id. Missing means the default. */
  steps: Record<string, number>;
  /** Changes an exercise's step by `delta` kg, kept between one increment and the maximum. */
  adjustStep: (libraryExerciseId: string, delta: number) => void;
}

export const useStepSizeStore = create<StepSizeState>()(
  persist(
    (set) => ({
      steps: {},

      adjustStep: (libraryExerciseId, delta) =>
        set((state) => {
          const current = state.steps[libraryExerciseId] ?? DEFAULT_STEP_KG;
          const next = Math.min(MAX_STEP_KG, Math.max(STEP_INCREMENT_KG, Math.round((current + delta) * 2) / 2));
          return { steps: { ...state.steps, [libraryExerciseId]: next } };
        }),
    }),
    {
      name: 'step-sizes',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** The weight step of an exercise, or the default when it has none (or isn't linked to the library). */
export function useStepSize(libraryExerciseId: string | undefined): number {
  return useStepSizeStore((s) => (libraryExerciseId ? s.steps[libraryExerciseId] : undefined) ?? DEFAULT_STEP_KG);
}
