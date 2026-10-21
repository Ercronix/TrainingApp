import React, { useRef } from 'react';
import { Animated, PanResponder, Platform } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

// Horizontal travel (or fling speed) that switches to the neighbouring tab on release
const SWITCH_DISTANCE = 60;
const SWITCH_VELOCITY = 0.5;
// The screen follows the finger at a fraction of the drag, as a hint of the switch
const DRAG_FOLLOW = 0.25;

interface SwipeTabsProps {
  navigation: NavigationProp<ParamListBase>;
  children: React.ReactNode;
}

/**
 * Wraps a tab screen so swiping left or right switches to the next or previous tab. It uses the
 * bubbling responder, so rows with their own swipe actions (SwipeableRow) claim the gesture first.
 */
export function SwipeTabs({ navigation, children }: SwipeTabsProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  // The pan responder is created once, so it reads the navigation through a ref
  const nav = useRef(navigation);
  nav.current = navigation;

  const reset = () =>
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
      bounciness: 0,
      speed: 20,
    }).start();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy * 2),
      onPanResponderMove: (_, g) => translateX.setValue(g.dx * DRAG_FOLLOW),
      onPanResponderRelease: (_, g) => {
        reset();
        const switching = Math.abs(g.dx) > SWITCH_DISTANCE || Math.abs(g.vx) > SWITCH_VELOCITY;
        if (!switching) return;

        const { routes, index } = nav.current.getState();
        // Swiping left reveals the tab to the right
        const target = routes[index + (g.dx < 0 ? 1 : -1)];
        if (target) nav.current.navigate(target.name);
      },
      onPanResponderTerminate: reset,
    }),
  ).current;

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX }] }} {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  );
}
