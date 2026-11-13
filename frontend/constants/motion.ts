import { Easing } from 'react-native';

// The three curves are Material 3's, as used by the Hyprland setup the glass theme is modelled on
// (emphasizedDecel, emphasizedAccel and standard).

/** Decelerating curve for things arriving: a quick start and a long, soft landing. */
export const EASE_OUT = Easing.bezier(0.05, 0.7, 0.1, 1);
/** Accelerating curve for things leaving the screen. */
export const EASE_IN = Easing.bezier(0.3, 0, 0.8, 0.15);
/** For things that stay on screen and move or change: slides, a border changing color. */
export const EASE_STANDARD = Easing.bezier(0.2, 0, 0, 1);

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
