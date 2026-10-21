import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '@/store/toastStore';
import { useTheme } from '@/hooks/useTheme';
import { EASE_IN, spring } from '@/constants/motion';

const useNativeDriver = Platform.OS !== 'web';
const VISIBLE_MS = 3000;
// Where it slides in from, above its resting place
const HIDDEN_Y = -24;

/**
 * Renders the toast from utils/confirm.ts at the top of the screen. Mounted once at the root.
 * It drops in, hides by itself after a few seconds, and a tap dismisses it sooner. Touches pass
 * through around it, so it never blocks the screen.
 */
export function ToastHost() {
  const toast = useToastStore((s) => s.toast);
  const visible = useToastStore((s) => s.visible);
  const hide = useToastStore((s) => s.hide);
  const clear = useToastStore((s) => s.clear);
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // A new toast (by id) starts over, even while the previous one is still shown
  const id = toast?.id;
  useEffect(() => {
    if (id == null) return;
    if (!visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: HIDDEN_Y, duration: 180, easing: EASE_IN, useNativeDriver }),
        Animated.timing(opacity, { toValue: 0, duration: 180, easing: EASE_IN, useNativeDriver }),
      ]).start(({ finished }) => { if (finished) clear(id); });
      return;
    }
    translateY.setValue(HIDDEN_Y);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, ...spring(0.4, 0.8), useNativeDriver }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver }),
    ]).start();
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [id, visible, hide, clear, translateY, opacity]);

  if (!toast) return null;

  return (
    <Animated.View
      style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, alignItems: 'center', opacity, transform: [{ translateY }] }}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <Pressable
        onPress={hide}
        className="w-full max-w-[400px] flex-row items-center gap-3 bg-surface border-2 border-edge border-b-[6px] rounded-md px-4 py-3"
        style={{ shadowColor: '#131313', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
        accessibilityLiveRegion="polite"
        accessibilityLabel={[toast.title, toast.message].filter(Boolean).join('. ')}
        accessibilityHint="Tap to dismiss"
      >
        {toast.icon && (
          <View className="w-9 h-9 rounded-full bg-accent-muted justify-center items-center">
            <Ionicons name={toast.icon} size={18} color={c.accentText} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-primary text-sm font-bold tracking-tight">{toast.title}</Text>
          {toast.message && <Text className="text-muted text-xs mt-0.5">{toast.message}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}
