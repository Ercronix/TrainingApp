import { Easing } from 'react-native';

/** Decelerating curve for things arriving: a quick start and a long, soft landing, like iOS. */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
/** Accelerating curve for things leaving the screen. */
export const EASE_IN = Easing.bezier(0.4, 0, 1, 1);

/**
 * Spring config for `Animated.spring` in SwiftUI's terms: `response` is the period in seconds
 * (lower is snappier) and `dampingRatio` 1 settles without overshoot, below 1 bounces slightly.
 */
export function spring(response: number, dampingRatio = 1) {
  return {
    stiffness: (2 * Math.PI / response) ** 2,
    damping: (4 * Math.PI * dampingRatio) / response,
    mass: 1,
  };
}
