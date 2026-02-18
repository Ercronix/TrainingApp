import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation dialog.
 * Uses window.confirm on web, Alert.alert on iOS/Android.
 */
export function confirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'OK',
  cancelText = 'Cancel'
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
}

/**
 * Cross-platform simple alert (no cancel button).
 */
export function alert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}