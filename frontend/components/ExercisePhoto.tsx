import { Animated, Easing, Platform, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { exerciseImageUrl } from '@/services/api';
import { useCatalog } from '@/hooks/useCatalog';
import { useLibrary } from '@/hooks/useLibrary';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/hooks/useTheme';
import { BodyMap, targetFills } from '@/components/BodyMap';

// The photos are 850 × 567
export const PHOTO_ASPECT = 3 / 2;
// Each position is held this long before fading into the other
const HOLD_MS = 1100;
const FADE_MS = 450;

/** The catalog exercise whose photos show a library entry, or null when it has none. */
export function usePhotoCatalogId(libraryExerciseId: number | null | undefined): number | null {
  const { library } = useLibrary();
  const { catalog } = useCatalog();
  const catalogId = library.find((e) => e.id === libraryExerciseId)?.catalogExerciseId ?? null;
  if (catalogId == null) return null;
  return catalog.find((e) => e.id === catalogId)?.hasImages === false ? null : catalogId;
}

/**
 * A square tile for an exercise in a list: its start photo, else a small body map of its
 * muscles, else a plain icon, so the rows stay aligned.
 */
export function ExerciseThumb({ libraryExerciseId, size = 52 }: { libraryExerciseId: number | null | undefined; size?: number }) {
  const c = useTheme();
  const { library } = useLibrary();
  const photoId = usePhotoCatalogId(libraryExerciseId);
  const muscles = library.find((e) => e.id === libraryExerciseId)?.muscles ?? [];
  if (photoId != null) {
    return <ExercisePhoto catalogExerciseId={photoId} width={size} height={size} className="rounded-sm" />;
  }
  return (
    <View className="rounded-sm bg-elevated justify-center items-center" style={{ width: size, height: size }} accessible={false}>
      {muscles.length > 0 ? (
        <BodyMap fills={targetFills(muscles, c, c.elevated)} height={size - 8} background={c.elevated} showLabels={false} />
      ) : (
        <Ionicons name="barbell-outline" size={size * 0.4} color={c.muted} />
      )}
    </View>
  );
}

/**
 * A catalog exercise's photos. With `animate`, the start and end positions cross-fade in a loop,
 * so the movement can be recognized without knowing its name; otherwise (and with reduced
 * motion) it shows the start position. Nothing is drawn if the photo can't be loaded.
 */
export function ExercisePhoto({
  catalogExerciseId,
  width,
  height = width / PHOTO_ASPECT,
  animate = false,
  className = '',
}: {
  catalogExerciseId: number;
  width: number;
  height?: number;
  animate?: boolean;
  className?: string;
}) {
  const reduceMotion = useReduceMotion();
  const [failed, setFailed] = useState(false);
  const end = useRef(new Animated.Value(0)).current;
  const looping = animate && reduceMotion === false;

  useEffect(() => {
    if (!looping) return;
    const fade = (toValue: number) => Animated.timing(end, {
      toValue, duration: FADE_MS, delay: HOLD_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web',
    });
    const loop = Animated.loop(Animated.sequence([fade(1), fade(0)]));
    loop.start();
    return () => {
      loop.stop();
      end.setValue(0);
    };
  }, [looping, end]);

  if (failed) return null;
  const size = { width, height };
  return (
    <View className={`overflow-hidden bg-elevated ${className}`} style={size} accessibilityIgnoresInvertColors>
      <Image
        source={exerciseImageUrl(catalogExerciseId, 0)}
        style={size}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
        onError={() => setFailed(true)}
      />
      {looping && (
        <Animated.View style={{ position: 'absolute', opacity: end }}>
          <Image source={exerciseImageUrl(catalogExerciseId, 1)} style={size} contentFit="cover" cachePolicy="disk" />
        </Animated.View>
      )}
    </View>
  );
}
