import { Animated, Platform, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import Svg, { Path } from 'react-native-svg';
import { Muscle, MuscleTarget } from '@/types';
import { BODY_BACK, BODY_FRONT, BODY_VIEW_HEIGHT, BODY_VIEW_WIDTH, BodyPart } from '@/constants/bodyMap';
import { EASE_OUT } from '@/constants/motion';
import { Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { blendHex } from '@/utils/color';

export type MuscleFills = Partial<Record<Muscle, string>>;

interface Shape {
  muscle: Muscle | null;
  d: string;
}

const toPath = (points: [number, number][], mirror: boolean) =>
  `M${points.map(([x, y]) => `${mirror ? BODY_VIEW_WIDTH - x : x} ${y}`).join('L')}Z`;

const toShapes = (parts: BodyPart[]): Shape[] =>
  parts.flatMap(({ muscle, points, center }) =>
    center
      ? [{ muscle, d: toPath(points, false) }]
      : [{ muscle, d: toPath(points, false) }, { muscle, d: toPath(points, true) }]);

const VIEWS = [
  { label: 'FRONT', shapes: toShapes(BODY_FRONT) },
  { label: 'BACK', shapes: toShapes(BODY_BACK) },
];

/** Primary muscles in the accent, secondary ones in a faded accent. */
export function targetFills(muscles: MuscleTarget[], c: Palette, background = c.surface): MuscleFills {
  const secondary = blendHex(c.accentText, background, 0.45);
  return Object.fromEntries(muscles.map((m) => [m.muscle, m.role === 'PRIMARY' ? c.accentText : secondary]));
}

/**
 * A front and back figure with the given muscles filled in. Muscles without a fill and the parts
 * without a muscle are drawn in muted tones of the background. With `animateIn`, the filled
 * muscles light up once after mounting.
 */
export function BodyMap({
  fills,
  height,
  background,
  onPressMuscle,
  animateIn = false,
  delay = 0,
  showLabels = true,
  accessibilityLabel,
}: {
  fills: MuscleFills;
  height: number;
  /** What the figure sits on; the gaps between muscles are drawn in it. Defaults to the surface. */
  background?: string;
  onPressMuscle?: (muscle: Muscle) => void;
  animateIn?: boolean;
  delay?: number;
  showLabels?: boolean;
  accessibilityLabel?: string;
}) {
  const c = useTheme();
  const reduceMotion = useReduceMotion();
  const bg = background ?? c.surface;
  const idle = blendHex(c.muted, bg, 0.28);
  const body = blendHex(c.muted, bg, 0.14);
  const width = (height * BODY_VIEW_WIDTH) / BODY_VIEW_HEIGHT;

  const glow = useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  useEffect(() => {
    if (!animateIn || reduceMotion == null) return;
    if (reduceMotion) {
      glow.setValue(1);
      return;
    }
    Animated.timing(glow, {
      toValue: 1, duration: 700, delay, easing: EASE_OUT, useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [animateIn, delay, reduceMotion, glow]);

  // While animating in, the fills sit on a layer of their own above the idle figure
  const layered = animateIn;
  const fillOf = (muscle: Muscle | null) => (muscle ? fills[muscle] ?? idle : body);

  const draw = (shapes: Shape[], fill: (s: Shape) => string | undefined) => (
    <Svg width={width} height={height} viewBox={`0 0 ${BODY_VIEW_WIDTH} ${BODY_VIEW_HEIGHT}`}>
      {shapes.map((s, i) => {
        const color = fill(s);
        if (!color) return null;
        const muscle = s.muscle;
        return (
          <Path
            key={i}
            d={s.d}
            fill={color}
            stroke={bg}
            strokeWidth={1.2}
            strokeLinejoin="round"
            onPress={onPressMuscle && muscle ? () => onPressMuscle(muscle) : undefined}
          />
        );
      })}
    </Svg>
  );

  return (
    <View
      className="flex-row justify-center"
      style={{ gap: height * 0.08 }}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {VIEWS.map((view) => (
        <View key={view.label} className="items-center">
          <View>
            {layered ? (
              <>
                {draw(view.shapes, (s) => (s.muscle ? idle : body))}
                <Animated.View style={{ position: 'absolute', opacity: glow }} pointerEvents="none">
                  {draw(view.shapes, (s) => (s.muscle ? fills[s.muscle] : undefined))}
                </Animated.View>
              </>
            ) : (
              draw(view.shapes, (s) => fillOf(s.muscle))
            )}
          </View>
          {showLabels && <Text className="text-muted text-[8px] tracking-[2px] mt-1.5">{view.label}</Text>}
        </View>
      ))}
    </View>
  );
}
