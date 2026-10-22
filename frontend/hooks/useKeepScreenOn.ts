import { useEffect, useId } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

/**
 * Keeps the screen from dimming and locking while the calling screen is mounted and `active`,
 * e.g. during a session so the phone stays ready between sets. Best effort: some browsers don't support it,
 * and on web the lock ends when the tab is hidden.
 */
export function useKeepScreenOn(active = true) {
  // Per caller, so one screen closing doesn't release another's lock
  const tag = useId();
  useEffect(() => {
    if (!active) return;
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [tag, active]);
}
