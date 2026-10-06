import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useRestTimerStore } from '@/store/restTimerStore';

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
 * Compact read-only countdown. Always rendered, muted while idle, so starting the timer doesn't
 * shift the layout around it.
 */
export function RestCountdown() {
  const { seconds, isRunning } = useRestSeconds();
  const color = !isRunning ? 'text-muted' : seconds <= 10 ? 'text-danger' : 'text-accent-text';
  return (
    <View className="bg-surface rounded-sm px-3 py-2">
      <Text className={`text-[11px] tracking-widest ${color}`}>
        REST {formatTime(seconds)}
      </Text>
    </View>
  );
}

const PRESET_MINUTES = [1, 2, 3, 5];

/** Slim rest bar: countdown with play/pause and reset; tap it to pick the rest length. */
export function RestTimer() {
  const { duration: customDuration, start, pause, reset, setDuration } = useRestTimerStore();
  const { seconds, isRunning } = useRestSeconds();
  const [showPresets, setShowPresets] = useState(false);
  const c = useTheme();

  const isUrgent = seconds <= 10 && isRunning;
  const progress = ((customDuration - seconds) / customDuration) * 100;

  return (
    <View className="bg-surface rounded-md">
      <View className="flex-row items-center gap-2 pl-4 pr-2 py-2">
        <TouchableOpacity
          className="flex-1 gap-1.5 py-1"
          onPress={() => setShowPresets((v) => !v)}
          accessibilityLabel={`Rest timer ${formatTime(seconds)}, tap to change the rest length`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Text className="text-muted text-[9px] tracking-[3px]">REST · {customDuration / 60} MIN</Text>
              <Ionicons name={showPresets ? 'chevron-down' : 'chevron-up'} size={12} color={c.muted} />
            </View>
            <Text className={`text-xl font-mono-bold ${isUrgent ? 'text-danger' : isRunning ? 'text-info' : 'text-primary'}`}>
              {formatTime(seconds)}
            </Text>
          </View>
          <View className="h-[3px] bg-base rounded-full overflow-hidden">
            <View className={`h-full rounded-full ${isUrgent ? 'bg-danger' : 'bg-info'}`} style={{ width: `${progress}%` }} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className={`w-11 h-11 rounded-sm justify-center items-center ${isRunning ? 'bg-elevated' : 'bg-accent'}`}
          onPress={() => (isRunning ? pause() : start())}
          accessibilityLabel={isRunning ? 'Pause rest timer' : 'Start rest timer'}
          activeOpacity={0.85}
        >
          <Ionicons name={isRunning ? 'pause' : 'play'} size={18} color={isRunning ? c.primary : c.accentFg} />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-11 h-11 rounded-sm justify-center items-center bg-elevated"
          onPress={reset}
          accessibilityLabel="Reset rest timer"
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={16} color={c.muted} />
        </TouchableOpacity>
      </View>

      {showPresets && (
        <View className="flex-row gap-2 px-2 pb-2">
          {PRESET_MINUTES.map((mins) => {
            const selected = customDuration === mins * 60;
            return (
              <TouchableOpacity
                key={mins}
                className={`flex-1 py-2.5 rounded-sm items-center ${selected ? 'bg-accent' : 'bg-base'}`}
                onPress={() => {
                  setDuration(mins * 60);
                  setShowPresets(false);
                }}
                activeOpacity={0.85}
              >
                <Text className={`text-[10px] font-bold tracking-widest ${selected ? 'text-accent-fg' : 'text-muted'}`}>
                  {mins} MIN
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
