import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'rest-timer';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let scheduledId: string | null = null;
let permissionRequested = false;

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rest Timer',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain && permissionRequested) return false;

  permissionRequested = true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Schedules a local notification to fire when the rest timer finishes, replacing any pending one. */
export async function scheduleRestTimerNotification(seconds: number): Promise<void> {
  await cancelRestTimerNotification();
  if (seconds <= 0) return;

  const granted = await ensurePermission();
  if (!granted) return;

  scheduledId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest Complete!',
      body: 'Time for your next set.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: CHANNEL_ID,
    },
  });
}

/** Cancels the pending rest-timer notification, if any (pause, reset, or manual completion). */
export async function cancelRestTimerNotification(): Promise<void> {
  if (!scheduledId) return;
  const id = scheduledId;
  scheduledId = null;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
