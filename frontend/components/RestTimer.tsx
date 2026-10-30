import { View, Text, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Tactile } from '@/components/Tactile';
import { useRestTimerStore } from '@/store/restTimerStore';
import { spring } from '@/constants/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Seconds left on the rest timer, re-rendering while it runs. */
function useRestSeconds() {
  const { endTime, remaining } = useRestTimerStore();
  const isRunning = endTime != null;
  const [nowMs, setNowMs] = useState(() => Date.now());

  // The store owns the countdown; this only re-renders the display while it runs
  useEffect(() => {
    if (!isRunning) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(timer);
  }, [isRunning]);

  const seconds = endTime != null ? Math.max(0, Math.ceil((endTime - nowMs) / 1000)) : remaining;
  return { seconds, isRunning };
}

const formatTime = (secs: number) => {
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
};

/**
 * A ring that drains smoothly while the rest runs, and pops once when the rest is over (not when
 * it is paused or reset).
 */
function RestRing({ size, strokeWidth, color, children }: {
  size: number;
  strokeWidth: number;
  color: string;
  children?: ReactNode;
}) {
  const { endTime, remaining, duration } = useRestTimerStore();
  const c = useTheme();
  const reduceMotion = useReduceMotion();
  // Fraction of the rest length still to go
  const left = useRef(new Animated.Value(remaining / duration)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const lastEndTime = useRef(endTime);

  useEffect(() => {
    if (endTime != null) {
      const ms = Math.max(0, endTime - Date.now());
      left.setValue(ms / (duration * 1000));
      Animated.timing(left, { toValue: 0, duration: ms, easing: Easing.linear, useNativeDriver: false }).start();
    } else {
      left.stopAnimation();
      left.setValue(remaining / duration);
      const ranOut = lastEndTime.current != null && Date.now() >= lastEndTime.current - 250;
      if (ranOut && !reduceMotion) {
        pop.setValue(1.25);
        Animated.spring(pop, { toValue: 1, ...spring(0.45, 0.4), useNativeDriver: Platform.OS !== 'web' }).start();
      }
    }
    lastEndTime.current = endTime;
  }, [endTime, remaining, duration, reduceMotion, left, pop]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <Animated.View
      style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', transform: [{ scale: pop }] }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={c.base} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={left.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] })}
        />
      </Svg>
      {children}
    </Animated.View>
  );
}

/**
 * Compact read-only countdown. Always rendered, muted while idle, so starting the timer doesn't
 * shift the layout around it.
 */
export function RestCountdown() {
  const { seconds, isRunning } = useRestSeconds();
  const c = useTheme();
  const urgent = isRunning && seconds <= 10;
  const color = !isRunning ? 'text-muted' : urgent ? 'text-danger' : 'text-accent-text';
  return (
    <View className="bg-surface rounded-sm px-3 py-2 flex-row items-center gap-2">
      <RestRing size={14} strokeWidth={2.5} color={!isRunning ? c.muted : urgent ? c.danger : c.accentText} />
      <Text className={`text-[11px] tracking-widest ${color}`}>
        REST {formatTime(seconds)}
      </Text>
    </View>
  );
}

// Rest lengths in seconds, shown as two rows of four
const PRESETS = [45, 60, 90, 120, 150, 180, 240, 300];
const PRESET_ROWS = [PRESETS.slice(0, 4), PRESETS.slice(4)];

/** A rest length as a short label, e.g. 0:45, 2:00 or 2:30. */
const formatLength = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

/** Slim rest bar: countdown with play/pause and reset; tap it to pick the rest length. */
export function RestTimer() {
  const { duration: customDuration, start, pause, reset, setDuration } = useRestTimerStore();
  const { seconds, isRunning } = useRestSeconds();
  const [showPresets, setShowPresets] = useState(false);
  const c = useTheme();

  const isUrgent = seconds <= 10 && isRunning;

  return (
    <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md">
      <View className="flex-row items-center gap-2 pl-2.5 pr-2 py-2">
        <TouchableOpacity
          className="flex-1 flex-row items-center gap-3"
          onPress={() => setShowPresets((v) => !v)}
          accessibilityLabel={`Rest timer ${formatTime(seconds)}, tap to change the rest length`}
        >
          <RestRing size={40} strokeWidth={4} color={isUrgent ? c.danger : isRunning ? c.info : c.subtle}>
            <Ionicons name="timer-outline" size={16} color={isUrgent ? c.danger : isRunning ? c.info : c.muted} />
          </RestRing>
          <View className="flex-1">
            <Text className={`text-xl font-mono-bold leading-6 ${isUrgent ? 'text-danger' : isRunning ? 'text-info' : 'text-primary'}`}>
              {formatTime(seconds)}
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-muted text-[9px] tracking-[3px]">REST · {formatLength(customDuration)} MIN</Text>
              <Ionicons name={showPresets ? 'chevron-down' : 'chevron-up'} size={12} color={c.muted} />
            </View>
          </View>
        </TouchableOpacity>
        <Tactile
          variant={isRunning ? 'elevated' : 'accent'}
          depth={3}
          className="w-11 h-11 rounded-sm justify-center items-center"
          onPress={() => (isRunning ? pause() : start())}
          accessibilityLabel={isRunning ? 'Pause rest timer' : 'Start rest timer'}
        >
          <Ionicons name={isRunning ? 'pause' : 'play'} size={18} color={isRunning ? c.primary : c.accentFg} />
        </Tactile>
        <Tactile
          variant="elevated"
          depth={3}
          className="w-11 h-11 rounded-sm justify-center items-center"
          onPress={reset}
          accessibilityLabel="Reset rest timer"
        >
          <Ionicons name="refresh" size={16} color={c.muted} />
        </Tactile>
      </View>

      {showPresets && (
        <View className="gap-2 px-2 pb-2">
          {PRESET_ROWS.map((row) => (
            <View key={row[0]} className="flex-row gap-2">
              {row.map((secs) => {
                const selected = customDuration === secs;
                return (
                  <Tactile
                    key={secs}
                    variant={selected ? 'accent' : 'elevated'}
                    depth={3}
                    className="py-2.5 rounded-sm items-center"
                    containerClassName="flex-1"
                    onPress={() => {
                      setDuration(secs);
                      setShowPresets(false);
                    }}
                    accessibilityState={{ selected }}
                  >
                    <Text className={`text-[10px] font-bold tracking-widest ${selected ? 'text-accent-fg' : 'text-muted'}`}>
                      {formatLength(secs)}
                    </Text>
                  </Tactile>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
