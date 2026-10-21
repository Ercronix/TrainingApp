import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AndroidHaptics } from 'expo-haptics';
import { useHapticsStore } from '@/store/hapticsStore';

/**
 * Haptic feedback, named by what happened rather than by strength, so it feels the same everywhere.
 * Android uses the system's click effects (crisper than the vibrator, and they follow the system's
 * touch feedback setting). The newer ones are missing on older Android, so each has a fallback that
 * exists on every version. Does nothing on web or when turned off on the Profile tab.
 */
function play(ios: () => Promise<void>, android: AndroidHaptics, fallback: AndroidHaptics) {
  if (Platform.OS === 'web' || !useHapticsStore.getState().enabled) return;
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(android)
      .catch(() => Haptics.performAndroidHapticsAsync(fallback))
      .catch(() => {});
  } else {
    ios().catch(() => {});
  }
}

export const haptics = {
  /** A button pressed down. */
  tap: () => play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), AndroidHaptics.Virtual_Key, AndroidHaptics.Virtual_Key),
  /** A scrub or picker moved onto a new value. */
  select: () => play(Haptics.selectionAsync, AndroidHaptics.Segment_Tick, AndroidHaptics.Clock_Tick),
  /** Something checked off, like a set or an exercise. */
  check: () => play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), AndroidHaptics.Toggle_On, AndroidHaptics.Virtual_Key),
  /** Something checked off undone. */
  uncheck: () => play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), AndroidHaptics.Toggle_Off, AndroidHaptics.Clock_Tick),
  /** One of the last seconds of the rest timer, to feel the end coming without looking. */
  countdown: () => play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), AndroidHaptics.Virtual_Key, AndroidHaptics.Virtual_Key),
  /** Something finished: the rest timer, a timed set, a session. */
  success: () => play(
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    AndroidHaptics.Confirm,
    AndroidHaptics.Long_Press,
  ),
  /** A session finished with a new personal record: the success, then a heavy knock. */
  record: () => {
    haptics.success();
    setTimeout(() => play(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      AndroidHaptics.Long_Press,
      AndroidHaptics.Long_Press,
    ), 180);
  },
};
