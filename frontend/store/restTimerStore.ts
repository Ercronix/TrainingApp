import { create } from 'zustand';
import { AppState } from 'react-native';
import { alert } from '@/utils/confirm';
import { cancelRestTimerNotification, scheduleRestTimerNotification } from '@/utils/restTimerNotifications';

// A timer finishing later than this was suspended in the background, so the notification already told the user
const LATE_COMPLETION_MS = 2000;

interface RestTimerState {
  /** Selected preset in seconds. */
  duration: number;
  /** When the running timer ends (epoch ms), or null while paused/stopped. */
  endTime: number | null;
  /** Seconds left while paused/stopped. */
  remaining: number;
  start: () => void;
  /** Starts a full rest from the selected preset, even if a timer is already running. */
  restart: () => void;
  pause: () => void;
  reset: () => void;
  setDuration: (seconds: number) => void;
}

// Lives outside the training screen so the timer keeps running after leaving it
let completionTimeout: ReturnType<typeof setTimeout> | null = null;

function clearCompletion() {
  if (completionTimeout) clearTimeout(completionTimeout);
  completionTimeout = null;
}

export const useRestTimerStore = create<RestTimerState>((set, get) => {
  const complete = () => {
    completionTimeout = null;
    const { endTime, duration } = get();
    // Reset to the preset, ready for the next set
    set({ endTime: null, remaining: duration });
    // Only alert when the user is in the app to see it; otherwise the notification covers it
    if (AppState.currentState === 'active' && endTime != null && Date.now() - endTime < LATE_COMPLETION_MS) {
      void cancelRestTimerNotification();
      alert('Rest Complete!', 'Time for next set!');
    }
  };

  const stop = (remaining: number) => {
    clearCompletion();
    void cancelRestTimerNotification();
    set({ endTime: null, remaining });
  };

  return {
    duration: 120,
    endTime: null,
    remaining: 120,

    start: () => {
      if (get().endTime != null) return;
      const seconds = get().remaining > 0 ? get().remaining : get().duration;
      clearCompletion();
      set({ endTime: Date.now() + seconds * 1000, remaining: seconds });
      // Backstop for when the app is backgrounded or closed and JS isn't running
      void scheduleRestTimerNotification(seconds);
      completionTimeout = setTimeout(complete, seconds * 1000);
    },

    restart: () => {
      stop(get().duration);
      get().start();
    },

    pause: () => {
      const { endTime } = get();
      if (endTime == null) return;
      stop(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
    },

    reset: () => stop(get().duration),

    setDuration: (seconds) => {
      set({ duration: seconds });
      stop(seconds);
    },
  };
});
