import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/theme';

interface RestTimerProps {
  duration: number;
  onComplete?: () => void;
}

export function RestTimer({ duration, onComplete }: RestTimerProps) {
  const colors = useThemeColors();
  const [seconds, setSeconds] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [customDuration, setCustomDuration] = useState(duration);

  useEffect(() => {
    if (!isRunning || seconds === 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, seconds, onComplete]);

  const toggle = () => {
    if (seconds === 0) setSeconds(customDuration);
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setSeconds(customDuration);
    setIsRunning(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const setPreset = (mins: number) => {
    const secs = mins * 60;
    setCustomDuration(secs);
    setSeconds(secs);
    setIsRunning(false);
  };

  const isUrgent = seconds <= 10 && isRunning;
  const progress = ((customDuration - seconds) / customDuration) * 100;

  const presets = [
    { label: '1 MIN', mins: 1, secs: 60 },
    { label: '2 MIN', mins: 2, secs: 120 },
    { label: '3 MIN', mins: 3, secs: 180 },
    { label: '5 MIN', mins: 5, secs: 300 },
  ];

  return (
    <View className="bg-surface dark:bg-surface-dark rounded-md p-4">
      <View className="flex-row items-center justify-between mb-3">
        {/* Timer display */}
        <View>
          <Text className="text-ink-muted dark:text-ink-muted-dark text-[9px] tracking-[3px] mb-1">REST TIMER</Text>
          <Text className={`text-[40px] font-bold tracking-tighter leading-10 ${isUrgent ? 'text-danger dark:text-danger-dark' : 'text-ink dark:text-ink-dark'}`}>
            {formatTime(seconds)}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`w-12 h-12 rounded-md justify-center items-center ${isRunning ? 'bg-surface-2 dark:bg-surface-2-dark' : 'bg-accent-solid'}`}
            onPress={toggle}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={20}
              color={isRunning ? '#7a7a7a' : '#0e0e0e'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-12 h-12 rounded-md justify-center items-center bg-surface-2 dark:bg-surface-2-dark"
            onPress={reset}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color={colors.inkMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-[3px] bg-canvas dark:bg-canvas-dark rounded-full overflow-hidden mb-3">
        <View
          className={`h-full rounded-full ${isUrgent ? 'bg-danger dark:bg-danger-dark' : 'bg-accent-solid'}`}
          style={{ width: `${progress}%` }}
        />
      </View>

      {/* Preset buttons */}
      <View className="flex-row gap-2">
        {presets.map(({ label, mins, secs }) => (
          <TouchableOpacity
            key={secs}
            className={`flex-1 py-2 rounded-sm items-center ${customDuration === secs ? 'bg-accent-solid' : 'bg-canvas dark:bg-canvas-dark'}`}
            onPress={() => setPreset(mins)}
            activeOpacity={0.85}
          >
            <Text className={`text-[10px] font-bold tracking-widest ${customDuration === secs ? 'text-accent-ink' : 'text-ink-muted dark:text-ink-muted-dark'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
