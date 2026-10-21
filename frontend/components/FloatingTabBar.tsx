import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useColorScheme } from 'nativewind';
import { useTheme } from '@/hooks/useTheme';
import { useTabBarStore } from '@/store/tabBarStore';

// 64 of content plus the 2px top and 6px bottom border
export const TAB_BAR_HEIGHT = 72;
const TAB_BAR_GAP = 12;
// Height of the floating tab bar plus its gap to the bottom edge
export const TAB_BAR_OFFSET = TAB_BAR_HEIGHT + TAB_BAR_GAP;
// Inset of the active tab's pill from the item's edges
const PILL_INSET = 6;

/**
 * The floating, blurred tab bar of the main tabs. It follows the pager while swiping: the pill
 * behind the active tab slides along and the tab colors cross-fade, so the bar always shows where
 * the swipe will land. It slides out of view while a tab's list scrolls down (see tabBarStore).
 */
export function FloatingTabBar({ state, descriptors, navigation, position }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const isLight = useColorScheme().colorScheme === 'light';
  const hidden = useTabBarStore((s) => s.hidden);
  const [itemWidth, setItemWidth] = useState(0);

  // Slides the bar below the screen's bottom edge while a tab's list scrolls down
  const hideOffset = insets.bottom + TAB_BAR_OFFSET + 8;
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: hidden ? hideOffset : 0,
      duration: hidden ? 200 : 250,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [hidden, hideOffset, translateY]);

  const last = state.routes.length - 1;
  const pillX = position.interpolate({
    inputRange: [0, last],
    outputRange: [0, last * itemWidth],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        { bottom: insets.bottom + TAB_BAR_GAP, borderColor: c.edge, transform: [{ translateY }] },
      ]}
    >
      <BlurView
        intensity={isLight ? 60 : 40}
        tint={isLight ? 'light' : 'dark'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface, opacity: isLight ? 0.55 : 0.45 }]} />
      </BlurView>

      <View className="flex-1 flex-row" onLayout={(e) => setItemWidth(e.nativeEvent.layout.width / state.routes.length)}>
        {itemWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              { width: itemWidth - PILL_INSET * 2, backgroundColor: c.accentMuted, transform: [{ translateX: pillX }] },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const focused = state.index === index;
          // 1 on this tab, fading to 0 one tab away, so the colors follow the swipe
          const activeness = position.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });
          const inactiveness = Animated.subtract(1, activeness);

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          const renderItem = (color: string) => (
            <>
              {options.tabBarIcon?.({ focused, color })}
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </>
          );

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={styles.item}
            >
              {/* Inactive and active colors stacked, cross-faded by the pager position */}
              <Animated.View style={[styles.itemContent, { opacity: inactiveness }]}>
                {renderItem(c.muted)}
              </Animated.View>
              <Animated.View style={[styles.itemContent, StyleSheet.absoluteFill, { opacity: activeness }]}>
                {renderItem(c.accent)}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: TAB_BAR_HEIGHT,
    borderRadius: 24,
    // Raised like the cards: a rim with a thicker bottom lip
    borderWidth: 2,
    borderBottomWidth: 6,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: PILL_INSET,
    borderRadius: 16,
  },
  item: {
    flex: 1,
  },
  itemContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
