import { View, Text, TouchableOpacity, Pressable, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { useDialogStore } from '@/store/dialogStore';
import { useTheme } from '@/hooks/useTheme';
import { contrastTextColor } from '@/utils/color';

/**
 * Renders the app's themed confirm/alert dialog. Mounted once at the root;
 * utils/confirm.ts drives it imperatively via useDialogStore so call sites
 * don't need to change (same confirm()/alert() signatures as before).
 */
export function ConfirmDialogHost() {
  const visible = useDialogStore((s) => s.visible);
  const title = useDialogStore((s) => s.title);
  const message = useDialogStore((s) => s.message);
  const confirmText = useDialogStore((s) => s.confirmText);
  const cancelText = useDialogStore((s) => s.cancelText);
  const destructive = useDialogStore((s) => s.destructive);
  const showCancel = useDialogStore((s) => s.showCancel);
  const onConfirm = useDialogStore((s) => s.onConfirm);
  const hide = useDialogStore((s) => s.hide);

  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';
  const c = useTheme();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.9);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const handleConfirm = () => {
    hide();
    onConfirm?.();
  };

  const confirmBg = destructive ? c.danger : c.accent;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <Pressable style={{ flex: 1 }} onPress={hide}>
          <BlurView
            intensity={isLight ? 40 : 30}
            tint={isLight ? 'light' : 'dark'}
            experimentalBlurMethod="dimezisBlurView"
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1, backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.5)' }} />
          </BlurView>
        </Pressable>
      </Animated.View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }} pointerEvents="box-none">
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: c.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: c.elevated,
            padding: 24,
            transform: [{ scale }],
            opacity,
          }}
        >
          <Text style={{ color: c.primary, fontSize: 18, fontWeight: '700', marginBottom: message ? 8 : 20 }}>
            {title}
          </Text>
          {message && (
            <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
              {message}
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {showCancel && (
              <TouchableOpacity
                onPress={hide}
                activeOpacity={0.85}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: c.elevated, alignItems: 'center' }}
              >
                <Text style={{ color: c.muted, fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
                  {cancelText.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.85}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: confirmBg, alignItems: 'center' }}
            >
              <Text style={{ color: contrastTextColor(confirmBg), fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
                {confirmText.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
