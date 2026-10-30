import { Animated, Easing, Linking, Platform, Text, View } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import { SvgXml } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useCatalog } from '@/hooks/useCatalog';
import { useLibrary } from '@/hooks/useLibrary';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/hooks/useTheme';
import { BodyMap, targetFills } from '@/components/BodyMap';

// Each pose is held this long before fading into the other
const HOLD_MS = 1100;
const FADE_MS = 450;
const LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

/** The catalog exercise whose drawing shows a library entry, or null when it has none. */
export function useIllustrationCatalogId(libraryExerciseId: number | null | undefined): number | null {
  const { library } = useLibrary();
  const { catalog } = useCatalog();
  const catalogId = library.find((e) => e.id === libraryExerciseId)?.catalogExerciseId ?? null;
  if (catalogId == null) return null;
  return catalog.find((e) => e.id === catalogId)?.hasIllustration ? catalogId : null;
}

/**
 * The Everkinetic drawings are dark lines on white. White becomes the background they sit on
 * (or is left out on a transparent one) and every other fill the line color, so they follow
 * the theme.
 */
function recolor(svg: string, background: string, line: string) {
  return svg.replace(/fill="([^"]*)"/g, (_, fill: string) =>
    `fill="${/^#f{3}(f{3})?$/i.test(fill) ? background : line}"`);
}

/** Width over height of a drawing, from its viewBox. */
function aspectOf(svg: string) {
  const match = svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
  return match ? Number(match[1]) / Number(match[2]) : 1;
}

// Drawings never change, so they are fetched once and kept with the offline cache
function useDrawing(catalogExerciseId: number, index: 0 | 1, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.illustration(catalogExerciseId, index),
    queryFn: () => catalogApi.getIllustration(catalogExerciseId, index),
    staleTime: Infinity,
    enabled,
  }).data;
}

/**
 * A catalog exercise's drawing, in the theme's colors. With `animate`, the start and end poses
 * cross-fade in a loop, so the movement can be recognized without knowing its name; otherwise
 * (and with reduced motion) it shows the start pose. Without a `height`, it takes the drawing's
 * proportions up to `maxHeight`.
 */
export function ExerciseIllustration({
  catalogExerciseId,
  width,
  height,
  maxHeight = 320,
  animate = false,
  background,
}: {
  catalogExerciseId: number;
  width: number;
  height?: number;
  maxHeight?: number;
  animate?: boolean;
  /** What the drawing sits on; 'transparent' leaves only the lines, for a drawing that doesn't animate. */
  background?: string;
}) {
  const c = useTheme();
  const reduceMotion = useReduceMotion();
  const looping = animate && reduceMotion === false;
  const bg = background ?? c.surface;
  const fill = bg === 'transparent' ? 'none' : bg;
  const start = useDrawing(catalogExerciseId, 0);
  const end = useDrawing(catalogExerciseId, 1, looping);
  const startXml = useMemo(() => start && recolor(start, fill, c.primary), [start, fill, c.primary]);
  const endXml = useMemo(() => end && recolor(end, fill, c.primary), [end, fill, c.primary]);
  const fade = useRef(new Animated.Value(0)).current;
  const showEnd = looping && !!endXml;

  useEffect(() => {
    if (!showEnd) return;
    const to = (toValue: number) => Animated.timing(fade, {
      toValue, duration: FADE_MS, delay: HOLD_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web',
    });
    const loop = Animated.loop(Animated.sequence([to(1), to(0)]));
    loop.start();
    return () => {
      loop.stop();
      fade.setValue(0);
    };
  }, [showEnd, fade]);

  const boxHeight = height ?? Math.min(maxHeight, start ? width / aspectOf(start) : width * 0.75);
  return (
    <View style={{ width, height: boxHeight, backgroundColor: bg }} accessible={false}>
      {startXml && <SvgXml xml={startXml} width={width} height={boxHeight} />}
      {showEnd && (
        <Animated.View style={{ position: 'absolute', opacity: fade }} pointerEvents="none">
          <SvgXml xml={endXml} width={width} height={boxHeight} />
        </Animated.View>
      )}
    </View>
  );
}

/** The credit the drawings' license (CC BY-SA 4.0) asks for, linking to the license. */
export function IllustrationCredit() {
  return (
    <Text
      className="text-muted text-[10px]"
      onPress={() => void Linking.openURL(LICENSE_URL)}
      accessibilityRole="link"
    >
      Drawing: Everkinetic, recolored · <Text className="underline">CC BY-SA 4.0</Text>
    </Text>
  );
}

/**
 * An exercise's picture in a list, straight on the row: its drawing, else a small body map of
 * its muscles, else a plain icon, in a square of the same size so the rows stay aligned.
 */
export function ExerciseThumb({ libraryExerciseId, size = 68 }: { libraryExerciseId: number | null | undefined; size?: number }) {
  const c = useTheme();
  const { library } = useLibrary();
  const drawingId = useIllustrationCatalogId(libraryExerciseId);
  const muscles = library.find((e) => e.id === libraryExerciseId)?.muscles ?? [];
  return (
    <View className="justify-center items-center" style={{ width: size, height: size }} accessible={false}>
      {drawingId != null ? (
        <ExerciseIllustration catalogExerciseId={drawingId} width={size} height={size} background="transparent" />
      ) : muscles.length > 0 ? (
        <BodyMap fills={targetFills(muscles, c)} height={size - 12} showLabels={false} />
      ) : (
        <Ionicons name="barbell-outline" size={size * 0.4} color={c.muted} />
      )}
    </View>
  );
}
