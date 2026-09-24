import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useRestTimerStore } from '@/store/restTimerStore';

export function RestTimer() {
  const { duration: customDuration, endTime, remaining, start, pause, reset, setDuration } = useRestTimerStore();
  const isRunning = endTime != null;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const c = useTheme();

  // The store owns the countdown; this only re-renders the display while it runs
  useEffect(() => {
    if (!isRunning) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(timer);
  }, [isRunning]);

  const seconds = endTime != null ? Math.max(0, Math.ceil((endTime - nowMs) / 1000)) : remaining;

  const toggle = () => (isRunning ? pause() : start());

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const setPreset = (mins: number) => setDuration(mins * 60);

  const isUrgent = seconds <= 10 && isRunning;
  const progress = ((customDuration - seconds) / customDuration) * 100;

  const presets = [
    { label: '1 MIN', mins: 1, secs: 60 },
    { label: '2 MIN', mins: 2, secs: 120 },
    { label: '3 MIN', mins: 3, secs: 180 },
    { label: '5 MIN', mins: 5, secs: 300 },
  ];

  return (
    <View className="bg-surface rounded-md p-4">
      <View className="flex-row items-center justify-between mb-3">
        {/* Timer display */}
        <View>
          <Text className="text-muted text-[9px] tracking-[3px] mb-1">REST TIMER</Text>
          <Text className={`text-[40px] font-mono-bold tracking-tighter leading-10 ${isUrgent ? 'text-danger' : 'text-primary'}`}>
            {formatTime(seconds)}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`w-12 h-12 rounded-md justify-center items-center ${isRunning ? 'bg-elevated' : 'bg-accent'}`}
            onPress={toggle}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={20}
              color={isRunning ? c.muted : c.accentFg}
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-12 h-12 rounded-md justify-center items-center bg-elevated"
            onPress={reset}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color={c.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-[3px] bg-base rounded-full overflow-hidden mb-3">
        <View
          className={`h-full rounded-full ${isUrgent ? 'bg-danger' : 'bg-accent'}`}
          style={{ width: `${progress}%` }}
        />
      </View>

      {/* Preset buttons */}
      <View className="flex-row gap-2">
        {presets.map(({ label, mins, secs }) => (
          <TouchableOpacity
            key={secs}
            className={`flex-1 py-2 rounded-sm items-center ${customDuration === secs ? 'bg-accent' : 'bg-base'}`}
            onPress={() => setPreset(mins)}
            activeOpacity={0.85}
          >
            <Text className={`text-[10px] font-bold tracking-widest ${customDuration === secs ? 'text-accent-fg' : 'text-muted'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
