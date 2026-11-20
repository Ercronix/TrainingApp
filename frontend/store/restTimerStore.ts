import { create } from 'zustand';
import { AppState } from 'react-native';
import { toast } from '@/utils/confirm';
import { haptics } from '@/utils/haptics';
import { isRestRunning } from '@/utils/restTimer';
import { cancelRestTimerNotification, scheduleRestTimerNotification } from '@/utils/restTimerNotifications';

// A timer finishing later than this was suspended in the background, so the notification already told the user
const LATE_COMPLETION_MS = 2000;
// Seconds left at which a tick plays, so the end of rest can be felt without looking
const COUNTDOWN_TICKS = [3, 2, 1];
// A tick later than this was held back while the app was in the background; it would only buzz in a burst
const LATE_TICK_MS = 500;

interface RestTimerState {
  /** Selected preset in seconds. */
  duration: number;
  /**
   * When the rest ends or ended (epoch ms), or null while paused/stopped. It stays set once the rest
   * is over, so the time since can be shown, until the next rest starts or the timer is reset
   * (see `restStatus` in utils/restTimer.ts).
   */
  endTime: number | null;
  /** Seconds left while paused/stopped. */
  remaining: number;
  /** Starts or resumes the rest; once it is over, starts a full rest from the preset. */
  start: () => void;
  /** Starts a full rest from the selected preset, even if a timer is already running. */
  restart: () => void;
  pause: () => void;
  reset: () => void;
  setDuration: (seconds: number) => void;
}

// Lives outside the training screen so the timer keeps running after leaving it
let completionTimeout: ReturnType<typeof setTimeout> | null = null;
let tickTimeouts: ReturnType<typeof setTimeout>[] = [];

function clearTimers() {
  if (completionTimeout) clearTimeout(completionTimeout);
  completionTimeout = null;
  tickTimeouts.forEach(clearTimeout);
  tickTimeouts = [];
}

function scheduleTicks(endTime: number) {
  tickTimeouts = COUNTDOWN_TICKS
    .filter((n) => endTime - n * 1000 > Date.now())
    .map((n) => setTimeout(() => {
      if (AppState.currentState === 'active' && Date.now() - (endTime - n * 1000) < LATE_TICK_MS) haptics.countdown();
    }, endTime - n * 1000 - Date.now()));
}

export const useRestTimerStore = create<RestTimerState>((set, get) => {
  const complete = () => {
    completionTimeout = null;
    const { endTime } = get();
    // The end time stays, so the timer shows REST OVER and counts up from it. The sound comes from
    // the scheduled notification (or the web beep), which keeps it to one even when the app is open.
    // Only tell here when the user is in the app to see it; otherwise the notification covers it.
    // A toast, not a dialog: it shouldn't need dismissing before logging the next set.
    if (AppState.currentState === 'active' && endTime != null && Date.now() - endTime < LATE_COMPLETION_MS) {
      haptics.success();
      toast('Rest over', 'Time for the next set', 'timer-outline');
    }
  };

  const stop = (remaining: number) => {
    clearTimers();
    void cancelRestTimerNotification();
    set({ endTime: null, remaining });
  };

  return {
    duration: 120,
    endTime: null,
    remaining: 120,

    start: () => {
      const { endTime: current, remaining, duration } = get();
      if (isRestRunning(current, Date.now())) return;
      // Resume a paused rest, but start a full one after a rest that ran out
      const seconds = current == null && remaining > 0 ? remaining : duration;
      clearTimers();
      const endTime = Date.now() + seconds * 1000;
      set({ endTime, remaining: seconds });
      // The sound at the end, and the backstop for when the app is backgrounded or closed and JS isn't running
      void scheduleRestTimerNotification(seconds);
      completionTimeout = setTimeout(complete, seconds * 1000);
      scheduleTicks(endTime);
    },

    restart: () => {
      stop(get().duration);
      get().start();
    },

    pause: () => {
      const { endTime } = get();
      // Nothing to pause once the rest is over
      if (endTime == null || !isRestRunning(endTime, Date.now())) return;
      stop(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
    },

    reset: () => stop(get().duration),

    setDuration: (seconds) => {
      set({ duration: seconds });
      stop(seconds);
    },
  };
});
