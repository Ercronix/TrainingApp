import { create } from 'zustand';

interface ShowDialogOptions {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    showCancel?: boolean;
    onConfirm?: () => void;
}

interface DialogState {
    visible: boolean;
    title: string;
    message?: string;
    confirmText: string;
    cancelText: string;
    destructive: boolean;
    showCancel: boolean;
    onConfirm: (() => void) | null;
    show: (opts: ShowDialogOptions) => void;
    hide: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
    visible: false,
    title: '',
    message: undefined,
    confirmText: 'OK',
    cancelText: 'Cancel',
    destructive: false,
    showCancel: true,
    onConfirm: null,
    show: (opts) => set({
        visible: true,
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText ?? 'OK',
        cancelText: opts.cancelText ?? 'Cancel',
        destructive: opts.destructive ?? false,
        showCancel: opts.showCancel ?? true,
        onConfirm: opts.onConfirm ?? null,
    }),
    hide: () => set({ visible: false }),
}));
