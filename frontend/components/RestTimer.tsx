import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface RestTimerProps {
  duration: number;
  onComplete?: () => void;
}

export function RestTimer({ duration, onComplete }: RestTimerProps) {
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
    <View className="bg-[#131313] rounded-md p-4">
      <View className="flex-row items-center justify-between mb-3">
        {/* Timer display */}
        <View>
          <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-1">REST TIMER</Text>
          <Text className={`text-[40px] font-bold tracking-tighter leading-10 ${isUrgent ? 'text-[#ff734a]' : 'text-[#f5f5f5]'}`}>
            {formatTime(seconds)}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`w-12 h-12 rounded-md justify-center items-center ${isRunning ? 'bg-[#1a1a1a]' : 'bg-[#cafd00]'}`}
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
            className="w-12 h-12 rounded-md justify-center items-center bg-[#1a1a1a]"
            onPress={reset}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color="#7a7a7a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-[3px] bg-[#0e0e0e] rounded-full overflow-hidden mb-3">
        <View
          className={`h-full rounded-full ${isUrgent ? 'bg-[#ff734a]' : 'bg-[#cafd00]'}`}
          style={{ width: `${progress}%` }}
        />
      </View>

      {/* Preset buttons */}
      <View className="flex-row gap-2">
        {presets.map(({ label, mins, secs }) => (
          <TouchableOpacity
            key={secs}
            className={`flex-1 py-2 rounded-sm items-center ${customDuration === secs ? 'bg-[#cafd00]' : 'bg-[#0e0e0e]'}`}
            onPress={() => setPreset(mins)}
            activeOpacity={0.85}
          >
            <Text className={`text-[10px] font-bold tracking-widest ${customDuration === secs ? 'text-[#0e0e0e]' : 'text-[#7a7a7a]'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
