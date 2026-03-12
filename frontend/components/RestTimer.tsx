import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface RestTimerProps {
  duration: number; // Sekunden
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
    if (seconds === 0) {
      setSeconds(duration);
    }
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setSeconds(duration);
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

  return (
    <View className="bg-slate-900 rounded-xl p-4 border border-slate-800">
      <View className="flex-row items-center justify-between">
        {/* Timer Display */}
        <View className="flex-1">
          <Text className="text-xs text-slate-400 mb-1">Rest Timer</Text>
          <Text className={`text-3xl font-bold ${
            seconds <= 10 && isRunning ? 'text-red-400' : 'text-slate-100'
          }`}>
            {formatTime(seconds)}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`w-12 h-12 rounded-full justify-center items-center ${
              isRunning ? 'bg-slate-700' : 'bg-blue-600'
            }`}
            onPress={toggle}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-12 h-12 rounded-full justify-center items-center bg-slate-800"
            onPress={reset}
          >
            <Ionicons name="refresh" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
        <View
          className={`h-full ${
            seconds <= 10 && isRunning ? 'bg-red-400' : 'bg-blue-600'
          }`}
          style={{ width: `${((duration - seconds) / duration) * 100}%` }}
        />
      </View>

      {/* Preset Buttons */}
      <View className="flex-row gap-2 mt-3">
        <TouchableOpacity
          className={`flex-1 rounded-lg py-2 ${
            customDuration === 60 ? 'bg-blue-950/40 border border-blue-900/40' : 'bg-slate-800'
          }`}
          onPress={() => setPreset(1)}
        >
          <Text className={`text-center text-sm ${
            customDuration === 60 ? 'text-blue-200' : 'text-slate-200'
          }`}>1 min</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-lg py-2 ${
            customDuration === 120 ? 'bg-blue-950/40 border border-blue-900/40' : 'bg-slate-800'
          }`}
          onPress={() => setPreset(2)}
        >
          <Text className={`text-center text-sm ${
            customDuration === 120 ? 'text-blue-200' : 'text-slate-200'
          }`}>2 min</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-lg py-2 ${
            customDuration === 180 ? 'bg-blue-950/40 border border-blue-900/40' : 'bg-slate-800'
          }`}
          onPress={() => setPreset(3)}
        >
          <Text className={`text-center text-sm ${
            customDuration === 180 ? 'text-blue-200' : 'text-slate-200'
          }`}>3 min</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-lg py-2 ${
            customDuration === 300 ? 'bg-blue-950/40 border border-blue-900/40' : 'bg-slate-800'
          }`}
          onPress={() => setPreset(5)}
        >
          <Text className={`text-center text-sm ${
            customDuration === 300 ? 'text-blue-200' : 'text-slate-200'
          }`}>5 min</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
