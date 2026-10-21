import { ReactNode, useEffect, useRef } from 'react';
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
  const opacity = useRef(new Animated.Value(1)).current;
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const enter = (fromX: number) => {
      opacity.setValue(0);
      shift.setValue(fromX);
      const config = { toValue: 1, duration: ENTER_DURATION, easing: EASE_OUT, useNativeDriver: Platform.OS !== 'web' };
      Animated.parallel([
        Animated.timing(opacity, config),
        Animated.timing(shift, { ...config, toValue: 0 }),
      ]).start();
    };

    if (navigation.isFocused()) enter(0);

    return navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) return;
      const { index, routes } = navigation.getState();
      const target = routes.findIndex((r) => r.key === route.key);
      enter(Math.sign(target - index) * ENTER_SHIFT);
    });
  }, [navigation, route.key, opacity, shift]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX: shift }] }}>
      {children}
    </Animated.View>
  );
}
