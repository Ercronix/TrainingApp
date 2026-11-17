import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSoundStore } from '@/store/soundStore';
import { cancelRestBeep, scheduleRestBeep } from '@/utils/restBeep';

const CHANNEL_ID = 'rest-timer';
// Android channels fix their sound once created, so a rest without sound needs a channel of its own
const SILENT_CHANNEL_ID = 'rest-timer-silent';
// Marks the rest timer's notifications in their data
const KIND = 'rest-timer';

Notifications.setNotificationHandler({
  // Only asked while the app is in the foreground
  handleNotification: async (notification) => {
    const isRest = notification.request.content.data?.kind === KIND;
    // The app shows the end of rest itself (the timer turns to REST OVER, a toast and haptics), so in
    // the foreground the rest notification only plays its sound. The OS plays it, so it follows the
    // phone's silent mode and volume.
    return {
      shouldShowBanner: !isRest,
      shouldShowList: !isRest,
      shouldPlaySound: !isRest || useSoundStore.getState().enabled,
      shouldSetBadge: false,
    };
  },
});

let scheduledId: string | null = null;
// Bumped by every schedule/cancel so a schedule still awaiting permission can tell it was superseded
let generation = 0;
let permissionRequested = false;

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rest Timer',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync(SILENT_CHANNEL_ID, {
      name: 'Rest Timer (no sound)',
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      enableVibrate: true,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain && permissionRequested) return false;

  permissionRequested = true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Schedules the end-of-rest alert, replacing any pending one. On native it is a local notification:
 * the sound while the app is open, and the reminder while it is in the background or closed. On web
 * it is a beep. Call it from the user's press, which web audio needs before it can play.
 */
export async function scheduleRestTimerNotification(seconds: number): Promise<void> {
  const sound = useSoundStore.getState().enabled;
  if (Platform.OS === 'web') {
    // Synchronously, still within the press that started the rest
    if (sound && seconds > 0) scheduleRestBeep(Date.now() + seconds * 1000);
    else cancelRestBeep();
    return;
  }

  await cancelRestTimerNotification();
  if (seconds <= 0) return;
  const current = ++generation;

  const granted = await ensurePermission();
  if (!granted || current !== generation) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest Complete!',
      body: 'Time for your next set.',
      sound: sound ? 'default' : false,
      data: { kind: KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: sound ? CHANNEL_ID : SILENT_CHANNEL_ID,
    },
  });
  if (current !== generation) {
    // Cancelled while scheduling (paused/reset right after starting)
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    return;
  }
  scheduledId = id;
}

/**
 * Cancels the pending end-of-rest alert, if any (pause, reset, or the next rest). A notification
 * that was already delivered is cleared from the tray, since it is out of date by then.
 */
export async function cancelRestTimerNotification(): Promise<void> {
  if (Platform.OS === 'web') {
    cancelRestBeep();
    return;
  }
  generation++;
  if (!scheduledId) return;
  const id = scheduledId;
  scheduledId = null;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.dismissNotificationAsync(id).catch(() => {});
}
