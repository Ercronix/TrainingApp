import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import type { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import { EASE_OUT } from '@/constants/motion';

// How far a tapped tab slides in from the side of the tab it replaces
const ENTER_SHIFT = 24;
const ENTER_DURATION = 320;

interface TabSceneProps {
  route: RouteProp<ParamListBase>;
  navigation: MaterialTopTabNavigationProp<ParamListBase>;
  children: ReactNode;
}

/**
 * Wraps a main tab. A tap on the tab bar switches the pager without its slide, which would scroll
 * past every tab in between, and the tab fades in here with a short shift from the tapped side
 * instead. Swipes are left to the pager. A tab that mounts while focused (the first one, or a far
 * tab that wasn't preloaded) fades in without the shift.
 */
export function TabScene({ route, navigation, children }: TabSceneProps) {
  // A tab that mounts focused fades in right away; start it hidden so it doesn't flash first
  const opacity = useRef(new Animated.Value(navigation.isFocused() ? 0 : 1)).current;
  const shift = useRef(new Animated.Value(0)).current;
  // Each entrance gets a number. While one runs the scene is bound to the animated values, and
  // after it the scene renders plainly at full opacity. On Android a scene that mounted or was
  // re-laid out by the pager mid-fade could otherwise keep the opacity of 0 it started from and
  // stay blank, since nothing re-renders it once the native animation is over.
  const [entrance, setEntrance] = useState<number | null>(() => (navigation.isFocused() ? 0 : null));

  useEffect(() => {
    if (entrance == null) return;
    const config = { toValue: 1, duration: ENTER_DURATION, easing: EASE_OUT, useNativeDriver: Platform.OS !== 'web' };
    const animation = Animated.parallel([
      Animated.timing(opacity, config),
      Animated.timing(shift, { ...config, toValue: 0 }),
    ]);
    const settle = () => setEntrance((current) => (current === entrance ? null : current));
    animation.start(settle);
    // In case the end of the animation is never reported
    const fallback = setTimeout(settle, ENTER_DURATION + 200);
    return () => {
      clearTimeout(fallback);
      animation.stop();
    };
  }, [entrance, opacity, shift]);

  useEffect(() => navigation.addListener('tabPress', () => {
    if (navigation.isFocused()) return;
    const { index, routes } = navigation.getState();
    const target = routes.findIndex((r) => r.key === route.key);
    opacity.setValue(0);
    shift.setValue(Math.sign(target - index) * ENTER_SHIFT);
    setEntrance((n) => (n ?? 0) + 1);
  }), [navigation, route.key, opacity, shift]);

  return (
    // The same keys either way: Animated fails when a transform it drove disappears
    <Animated.View
      style={entrance == null
        ? { flex: 1, opacity: 1, transform: [{ translateX: 0 }] }
        : { flex: 1, opacity, transform: [{ translateX: shift }] }}
    >
      {children}
    </Animated.View>
  );
}
