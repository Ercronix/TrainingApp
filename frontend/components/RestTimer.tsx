import { View, Text, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Tactile } from '@/components/Tactile';
import { useRestTimerStore } from '@/store/restTimerStore';
import { spring } from '@/constants/motion';
import { formatOvertime, formatRestClock, formatRestLength, restStatus, type RestPhase } from '@/utils/restTimer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * The rest timer's phase and seconds (left, or since it ran out), re-rendering while it counts
 * down or up.
 */
function useRestStatus() {
  const { endTime, remaining } = useRestTimerStore();
  const [nowMs, setNowMs] = useState(() => Date.now());

  // The store owns the countdown; this only re-renders the display while it runs or is over
  useEffect(() => {
    if (endTime == null) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(timer);
  }, [endTime]);

  return restStatus(endTime, remaining, nowMs);
}

/**
 * A ring that drains smoothly while the rest runs, then pops and fills up again in the color of
 * the over state when it runs out (not when it is paused or reset).
 */
function RestRing({ phase, size, strokeWidth, color, children }: {
  phase: RestPhase;
  size: number;
  strokeWidth: number;
  color: string;
  children?: ReactNode;
}) {
  const { endTime, remaining, duration } = useRestTimerStore();
  const c = useTheme();
  const reduceMotion = useReduceMotion();
  // Fraction of the rest length still to go
  const left = useRef(new Animated.Value(phase === 'over' ? 1 : remaining / duration)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const lastPhase = useRef(phase);

  useEffect(() => {
    if (phase === 'running' && endTime != null) {
      const ms = Math.max(0, endTime - Date.now());
      left.setValue(ms / (duration * 1000));
      Animated.timing(left, { toValue: 0, duration: ms, easing: Easing.linear, useNativeDriver: false }).start();
    } else {
      left.stopAnimation();
      left.setValue(phase === 'over' ? 1 : remaining / duration);
      if (phase === 'over' && lastPhase.current === 'running' && !reduceMotion) {
        pop.setValue(1.25);
        Animated.spring(pop, { toValue: 1, ...spring(0.45, 0.4), useNativeDriver: Platform.OS !== 'web' }).start();
      }
    }
    lastPhase.current = phase;
  }, [phase, endTime, remaining, duration, reduceMotion, left, pop]);

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
 * shift the layout around it. Once the rest is over it turns red and counts the time since.
 */
export function RestCountdown() {
  const { phase, seconds } = useRestStatus();
  const c = useTheme();
  const over = phase === 'over';
  const urgent = over || (phase === 'running' && seconds <= 10);
  const color = phase === 'idle' ? 'text-muted' : urgent ? 'text-danger' : 'text-accent-text';
  return (
    <View className={`${over ? 'bg-danger-muted' : 'bg-surface'} rounded-sm px-3 py-2 flex-row items-center gap-2`}>
      <RestRing
        phase={phase}
        size={14}
        strokeWidth={2.5}
        color={phase === 'idle' ? c.muted : urgent ? c.danger : c.accentText}
      />
      <Text className={`text-[11px] tracking-widest ${color}`}>
        {over ? `REST OVER ${formatOvertime(seconds)}` : `REST ${formatRestClock(seconds)}`}
      </Text>
    </View>
  );
}

// Rest lengths in seconds, shown as two rows of four
const PRESETS = [45, 60, 90, 120, 150, 180, 240, 300];
const PRESET_ROWS = [PRESETS.slice(0, 4), PRESETS.slice(4)];

/**
 * Slim rest bar: countdown with play/pause and reset; tap it to pick the rest length. When the
 * rest runs out it turns red and counts up the time since, until the next rest starts or it is reset.
 */
export function RestTimer() {
  const { duration: customDuration, start, pause, reset, setDuration } = useRestTimerStore();
  const { phase, seconds } = useRestStatus();
  const [showPresets, setShowPresets] = useState(false);
  const c = useTheme();

  const isRunning = phase === 'running';
  const isOver = phase === 'over';
  const isUrgent = isOver || (isRunning && seconds <= 10);
  const ringColor = isUrgent ? c.danger : isRunning ? c.info : c.subtle;
  const timeColor = isUrgent ? 'text-danger' : isRunning ? 'text-info' : 'text-primary';
  const time = isOver ? formatOvertime(seconds) : formatRestClock(seconds);

  return (
    <View className={`rim rounded-md ${isOver ? 'bg-danger-muted border-danger-lip' : 'bg-surface border-edge'}`}>
      <View className="flex-row items-center gap-2 pl-2.5 pr-2 py-2">
        <TouchableOpacity
          className="flex-1 flex-row items-center gap-3"
          onPress={() => setShowPresets((v) => !v)}
          accessibilityLabel={isOver
            ? `Rest over ${formatRestLength(seconds)} ago, tap to change the rest length`
            : `Rest timer ${time}, tap to change the rest length`}
        >
          <RestRing phase={phase} size={40} strokeWidth={4} color={ringColor}>
            <Ionicons
              name={isOver ? 'alarm-outline' : 'timer-outline'}
              size={16}
              color={isUrgent ? c.danger : isRunning ? c.info : c.muted}
            />
          </RestRing>
          <View className="flex-1">
            <Text className={`text-xl font-mono-bold leading-6 ${timeColor}`}>{time}</Text>
            <View className="flex-row items-center gap-1">
              <Text className={`text-[9px] tracking-[3px] ${isOver ? 'text-danger font-bold' : 'text-muted'}`}>
                {isOver ? 'REST OVER' : 'REST'} · {formatRestLength(customDuration)} MIN
              </Text>
              <Ionicons name={showPresets ? 'chevron-down' : 'chevron-up'} size={12} color={isOver ? c.danger : c.muted} />
            </View>
          </View>
        </TouchableOpacity>
        <Tactile
          variant={isRunning ? 'elevated' : 'accent'}
          depth={3}
          className="w-11 h-11 rounded-sm justify-center items-center"
          onPress={() => (isRunning ? pause() : start())}
          accessibilityLabel={isRunning ? 'Pause rest timer' : isOver ? 'Start next rest' : 'Start rest timer'}
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
                      {formatRestLength(secs)}
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
