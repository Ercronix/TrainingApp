import { useDialogStore } from '@/store/dialogStore';
import { ToastIcon, useToastStore } from '@/store/toastStore';

/**
 * Themed confirmation dialog (replaces the native Alert/window.confirm so it
 * matches the app's active theme, with a blurred backdrop).
 */
export function confirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'OK',
  cancelText = 'Cancel'
) {
  useDialogStore.getState().show({
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    showCancel: true,
    destructive: confirmText.toLowerCase() === 'delete',
  });
}

/**
 * Themed simple alert (no cancel button).
 */
export function alert(title: string, message?: string) {
  useDialogStore.getState().show({
    title,
    message,
    confirmText: 'OK',
    showCancel: false,
  });
}

/**
 * Brief notice at the top of the screen that hides by itself, for news that needs no answer
 * (e.g. rest is over). Unlike alert() it doesn't block what the user is doing.
 */
export function toast(title: string, message?: string, icon?: ToastIcon) {
  useToastStore.getState().show({ title, message, icon });
}
