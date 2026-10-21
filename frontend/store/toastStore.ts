import { create } from 'zustand';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type ToastIcon = ComponentProps<typeof Ionicons>['name'];

export interface Toast {
  /** Changes with every toast, so showing the same text again restarts it. */
  id: number;
  title: string;
  message?: string;
  icon?: ToastIcon;
}

interface ToastState {
  /** The last toast shown; kept after hiding so it can animate out. */
  toast: Toast | null;
  visible: boolean;
  show: (toast: Omit<Toast, 'id'>) => void;
  hide: () => void;
  /** Removes a hidden toast once it has animated out, unless a newer one replaced it. */
  clear: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toast: null,
  visible: false,
  show: (toast) => set({ toast: { ...toast, id: nextId++ }, visible: true }),
  hide: () => set({ visible: false }),
  clear: (id) => {
    if (!get().visible && get().toast?.id === id) set({ toast: null });
  },
}));
