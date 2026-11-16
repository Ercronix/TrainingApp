import { ReactNode, useEffect, useId, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import { useTheme } from '@/hooks/useTheme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { blendHex } from '@/utils/color';

// One there-and-back drift of the lights, in ms
const PERIOD = 26_000;

interface Light {
  color: string;
  opacity: number;
  /** Center and radii as fractions of the screen's width and height. */
  cx: number; cy: number; rx: number; ry: number;
  /** How far it drifts, in px, and how much it grows on the way. */
  dx: number; dy: number; grow: number;
}

/**
 * The backdrop of a glass theme: the base color with a few soft lights drifting slowly across it,
 * like an aurora wallpaper behind translucent windows. Every instance takes its position from the
 * clock, so the lights don't jump when one screen covers another.
 *
 * It wraps every screen in every theme and only draws in a glass one. Wrapping only in glass would
 * change the screens' parent when the theme loads or changes, which remounts them, and the tab
 * pager on Android comes back blank after a remount.
 */
export function AuroraBackdrop({ children }: { children: ReactNode }) {
  const c = useTheme();
  const isLight = useColorScheme().colorScheme === 'light';
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const drift = useRef(new Animated.Value(0)).current;
  // Several backdrops are mounted at once (one per screen), and gradient ids are global on the web
  const gradientId = useId();

  useEffect(() => {
    if (!c.glass || reduceMotion !== false) return;
    const useNativeDriver = Platform.OS !== 'web';
    const easing = Easing.inOut(Easing.sin);
    // Where the clock puts the drift right now: 0 → 1 in the first half of a period, then back
    const phase = (Date.now() % (PERIOD * 2)) / PERIOD;
    const rising = phase < 1;
    const eased = (1 - Math.cos(Math.PI * (rising ? phase : 2 - phase))) / 2;
    drift.setValue(eased);
    const leg = (toValue: number, duration = PERIOD) => Animated.timing(drift, { toValue, duration, easing, useNativeDriver });
    const firstLeg = leg(rising ? 1 : 0, PERIOD * (rising ? 1 - phase : 2 - phase));
    const loop = Animated.loop(Animated.sequence(rising ? [leg(0), leg(1)] : [leg(1), leg(0)]));
    let cancelled = false;
    firstLeg.start(({ finished }) => { if (finished && !cancelled) loop.start(); });
    return () => {
      cancelled = true;
      firstLeg.stop();
      loop.stop();
    };
  }, [c.glass, reduceMotion, drift]);

  const strength = isLight ? 0.7 : 1;
  const lights: Light[] = [
    { color: c.accent, opacity: 0.34 * strength, cx: 0.62, cy: 0.3, rx: 0.75, ry: 0.22, dx: -40, dy: 30, grow: 0.15 },
    { color: c.info, opacity: 0.2 * strength, cx: 1.0, cy: 0.42, rx: 0.5, ry: 0.42, dx: 30, dy: -40, grow: -0.1 },
    { color: blendHex(c.accent, c.base, isLight ? 0.5 : 0.35), opacity: 0.7 * strength, cx: 0.02, cy: 0.72, rx: 0.7, ry: 0.3, dx: 40, dy: -30, grow: 0.12 },
    { color: blendHex(c.info, c.base, isLight ? 0.5 : 0.3), opacity: 0.75 * strength, cx: 0.65, cy: 1.02, rx: 0.85, ry: 0.26, dx: -30, dy: -24, grow: 0.1 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.glass ? c.base : undefined }}>
      {c.glass && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {lights.map((l, i) => {
            const w = l.rx * 2 * width;
            const h = l.ry * 2 * height;
            return (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  left: l.cx * width - w / 2,
                  top: l.cy * height - h / 2,
                  width: w,
                  height: h,
                  transform: [
                    { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, l.dx] }) },
                    { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, l.dy] }) },
                    { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + l.grow] }) },
                  ],
                }}
              >
                <Svg width={w} height={h}>
                  <Defs>
                    <RadialGradient id={`${gradientId}-${i}`} cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0" stopColor={l.color} stopOpacity={l.opacity} />
                      <Stop offset="0.55" stopColor={l.color} stopOpacity={l.opacity * 0.4} />
                      <Stop offset="1" stopColor={l.color} stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={`url(#${gradientId}-${i})`} />
                </Svg>
              </Animated.View>
            );
          })}
        </View>
      )}
      {children}
    </View>
  );
}
