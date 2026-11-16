import { View, Text, TouchableOpacity } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { useStretchRoutine } from '@/hooks/useStretchRoutine';
import { useStretchCheckIns } from '@/hooks/useStretchCheckIns';
import { useKeepScreenOn } from '@/hooks/useKeepScreenOn';
import { Tactile } from '@/components/Tactile';
import { haptics } from '@/utils/haptics';
import { formatClock, routineSeconds, sessionSteps, StretchStep } from '@/utils/stretch';

const RING_SIZE = 256;
const RING_STROKE = 16;
// Buzz on each of the last seconds of a hold
const COUNTDOWN_SECONDS = 3;

const sideLabel = (step: StretchStep) =>
  step.side === 'left' ? 'LEFT SIDE' : step.side === 'right' ? 'RIGHT SIDE' : step.item.kind === 'reps' ? 'REPS' : 'HOLD';

/**
 * Walks through the routine one stretch (or side) at a time. Holds count down and move on by
 * themselves, reps wait for a tap. Finishing checks today off. Nothing is saved before that, so
 * leaving midway needs no confirmation.
 */
export default function StretchSessionScreen() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { items, isLoading } = useStretchRoutine();
  const { streak, checkInToday } = useStretchCheckIns();
  const steps = useMemo(() => sessionSteps(items), [items]);

  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  // When the current hold ends; null for reps and while paused
  const [endAt, setEndAt] = useState<number | null>(null);
  // Time left on the hold while paused
  const [pausedMs, setPausedMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const started = useRef(false);
  const lastBuzz = useRef<number | null>(null);

  useKeepScreenOn(!finished);

  const goTo = useCallback((i: number) => {
    if (i >= steps.length) {
      setEndAt(null);
      setPausedMs(null);
      setFinished(true);
      haptics.success();
      checkInToday();
      return;
    }
    const step = steps[Math.max(0, i)];
    setIndex(Math.max(0, i));
    setPausedMs(null);
    setNow(Date.now());
    setEndAt(step.item.kind === 'hold' ? Date.now() + step.item.amount * 1000 : null);
    lastBuzz.current = null;
  }, [steps, checkInToday]);

  // Start once the routine is loaded
  useEffect(() => {
    if (started.current || steps.length === 0) return;
    started.current = true;
    goTo(0);
  }, [steps, goTo]);

  // Tick while a hold runs
  useEffect(() => {
    if (endAt == null) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [endAt]);

  const step = steps[index];
  const isHold = step?.item.kind === 'hold';
  const paused = pausedMs != null;
  const leftMs = paused ? pausedMs : endAt != null ? Math.max(0, endAt - now) : 0;
  const leftSeconds = Math.ceil(leftMs / 1000);

  useEffect(() => {
    if (endAt == null || finished) return;
    if (now >= endAt) {
      haptics.check();
      goTo(index + 1);
    } else if (leftSeconds <= COUNTDOWN_SECONDS && lastBuzz.current !== leftSeconds) {
      lastBuzz.current = leftSeconds;
      haptics.countdown();
    }
  }, [now, endAt, finished, index, leftSeconds, goTo]);

  const togglePause = () => {
    if (paused) {
      setEndAt(Date.now() + pausedMs);
      setPausedMs(null);
    } else if (endAt != null) {
      setPausedMs(Math.max(0, endAt - Date.now()));
      setEndAt(null);
    }
  };

  const header = (
    <View className="flex-row justify-between items-center px-6 pt-14 pb-4">
      <TouchableOpacity onPress={() => router.back()} accessibilityLabel="End session">
        <Ionicons name="close" size={22} color={c.muted} />
      </TouchableOpacity>
      <Text className="text-muted text-[10px] tracking-[4px]">STRETCHING</Text>
      <Text className="text-muted text-xs font-mono-bold w-12 text-right">
        {!finished && steps.length > 0 ? `${String(index + 1).padStart(2, '0')}/${String(steps.length).padStart(2, '0')}` : ''}
      </Text>
    </View>
  );

  if (finished) {
    return (
      <View className="flex-1 bg-base">
        {header}
        <View className="flex-1 px-6" style={{ paddingBottom: insets.bottom + 24 }}>
          <Text className="text-accent-text text-[10px] tracking-[4px] mb-2 mt-6">ROUTINE COMPLETE</Text>
          <Text className="text-primary text-[40px] font-bold tracking-tighter leading-[44px] mb-6">
            STRETCHED{'\n'}FOR TODAY
          </Text>
          <View className="bg-surface-done border-2 border-edge-done border-b-[6px] rounded-md flex-row">
            <View className="flex-1 px-5 py-4">
              <Text className="text-accent-text text-[28px] font-mono-bold">{streak}</Text>
              <Text className="text-muted text-[9px] tracking-[3px]">DAY STREAK</Text>
            </View>
            <View className="flex-1 px-5 py-4">
              <Text className="text-primary text-[28px] font-mono-bold">{formatClock(routineSeconds(items))}</Text>
              <Text className="text-muted text-[9px] tracking-[3px]">STRETCHED</Text>
            </View>
          </View>
          <View className="flex-1" />
          <Tactile className="rounded-md py-5 items-center" onPress={() => router.back()}>
            <Text className="text-accent-fg text-sm font-bold tracking-[2px]">DONE</Text>
          </Tactile>
        </View>
      </View>
    );
  }

  if (!step) {
    return (
      <View className="flex-1 bg-base">
        {header}
        <View className="flex-1 justify-center items-center px-6 gap-3">
          {isLoading ? (
            <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
          ) : (
            <>
              <Ionicons name="body-outline" size={48} color={c.subtle} />
              <Text className="text-subtle text-xl font-bold tracking-[2px]">NO STRETCHES YET</Text>
              <Text className="text-dim text-sm text-center">Add stretches to your routine first.</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  const next = steps[index + 1];
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = isHold ? leftMs / (step.item.amount * 1000) : 1;

  return (
    <View className="flex-1 bg-base">
      {header}

      {/* One segment per step */}
      <View className="flex-row gap-1 px-6">
        {steps.map((_, i) => (
          <View
            key={i}
            className={`flex-1 h-1.5 rounded-full ${i < index ? 'bg-accent' : i === index ? 'bg-accent-lip' : 'bg-elevated'}`}
          />
        ))}
      </View>

      <View className="flex-1 items-center px-4 pt-7" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="bg-accent-muted rounded-sm h-[18px] pl-1.5 pr-1 justify-center mb-2.5">
          <Text
            className="text-accent-text text-[9px] leading-[12px] font-bold tracking-[2px]"
            style={{ includeFontPadding: false, textAlignVertical: 'center' }}
          >
            {sideLabel(step)}
          </Text>
        </View>
        <Text className="text-primary text-[32px] font-bold tracking-tighter leading-9 text-center mb-6" numberOfLines={2}>
          {step.item.name}
        </Text>

        <View style={{ width: RING_SIZE, height: RING_SIZE }} className="justify-center items-center mb-7">
          <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} stroke={c.elevated} strokeWidth={RING_STROKE} fill="none" />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              stroke={paused ? c.muted : c.accent}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - fraction)}
            />
          </Svg>
          <Text className="text-primary text-[56px] font-mono-bold tracking-tighter">
            {isHold ? formatClock(leftSeconds) : `${step.item.amount}x`}
          </Text>
          <Text className="text-muted text-[10px] tracking-[4px]">
            {isHold ? (paused ? 'PAUSED' : 'HOLD') : 'TAP NEXT WHEN DONE'}
          </Text>
        </View>

        <View className="flex-row items-start gap-5">
          <Tactile
            variant="surface"
            className="w-16 h-16 rounded-full items-center justify-center"
            containerClassName="mt-2"
            onPress={() => goTo(index - 1)}
            disabled={index === 0}
            accessibilityLabel="Previous"
          >
            <Ionicons name="play-skip-back" size={20} color={index === 0 ? c.subtle : c.primary} />
          </Tactile>
          {isHold ? (
            <Tactile
              className="w-20 h-20 rounded-full items-center justify-center"
              onPress={togglePause}
              accessibilityLabel={paused ? 'Resume' : 'Pause'}
            >
              <Ionicons name={paused ? 'play' : 'pause'} size={28} color={c.accentFg} />
            </Tactile>
          ) : (
            <Tactile
              className="w-20 h-20 rounded-full items-center justify-center"
              onPress={() => goTo(index + 1)}
              haptic={false}
              accessibilityLabel="Done, next"
            >
              <Ionicons name="checkmark" size={30} color={c.accentFg} />
            </Tactile>
          )}
          <Tactile
            variant="surface"
            className="w-16 h-16 rounded-full items-center justify-center"
            containerClassName="mt-2"
            onPress={() => goTo(index + 1)}
            accessibilityLabel="Next"
          >
            <Ionicons name="play-skip-forward" size={20} color={c.primary} />
          </Tactile>
        </View>

        <View className="flex-1" />
        <View className="self-stretch bg-surface border-2 border-edge border-b-[6px] rounded-md px-5 py-4 flex-row items-center gap-3">
          <Text className="text-muted text-[10px] tracking-[4px]">UP NEXT</Text>
          <Text className="flex-1 text-primary text-[15px] font-bold text-right" numberOfLines={1}>
            {next ? `${next.item.name}${next.side === 'right' ? ', right' : ''}` : 'Finish'}
          </Text>
        </View>
      </View>
    </View>
  );
}
