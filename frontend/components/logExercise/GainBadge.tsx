import { useEffect, useRef } from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { spring } from '@/constants/motion';
import { Gain } from '@/utils/logExercise';

/** A set's improvement over last session; pops in when the set was just logged. */
export function GainBadge({ gain, animate }: { gain: Gain; animate: boolean }) {
  const c = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(animate ? 0.3 : 1)).current;
  useEffect(() => {
    if (!animate || reduceMotion == null) return;
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, { toValue: 1, ...spring(0.4, 0.45), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [animate, reduceMotion, scale]);

  return (
    <Animated.View style={{ alignSelf: 'flex-start', transform: [{ scale }] }}>
      <View
        className={`flex-row items-center gap-1 rounded-sm px-1.5 py-0.5 ${gain.record ? 'bg-accent' : 'bg-accent-muted'}`}
        accessibilityLabel={gain.record ?? `${gain.label} on last session`}
      >
        <Ionicons name={gain.record ? 'trophy' : 'trending-up'} size={10} color={gain.record ? c.accentFg : c.accentText} />
        <Text className={`text-[9px] font-mono-bold ${gain.record ? 'text-accent-fg' : 'text-accent-text'}`}>{gain.label}</Text>
      </View>
    </Animated.View>
  );
}
