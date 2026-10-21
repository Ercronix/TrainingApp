import React, { useRef, useCallback, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { blendHex } from '@/utils/color';
import { useTabSwipeLock } from '@/hooks/useTabSwipeLock';

export interface SwipeAction {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  label?: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  rightActions?: SwipeAction[];
  leftActions?: SwipeAction[];
  enabled?: boolean;
}

const ACTION_WIDTH = 72;
const SWIPE_THRESHOLD = 40;
// Horizontal travel before the row takes the swipe; vertical travel this far leaves it to the list
const ACTIVATE_DISTANCE = 10;
// An activation offset that is never reached, for a direction the row can't move in
const NEVER = 10000;
const CLIP_RADIUS = 18;
// Space between the row and each action tile
const ACTION_GAP = 6;
const LIP = 4;
const RIM = 2;

/** A raised action tile like the rows: a rim, a thicker bottom lip, and it sinks while pressed. */
function ActionTile({ action, onPress, side }: { action: SwipeAction; onPress: () => void; side: 'left' | 'right' }) {
  const edge = blendHex(action.color, action.backgroundColor, 0.35);
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={action.label}
      style={{ flex: 1, [side === 'right' ? 'marginLeft' : 'marginRight']: ACTION_GAP }}
    >
      {({ pressed }) => (
        <View
          style={{
            flex: 1,
            marginTop: pressed ? LIP : 0,
            backgroundColor: action.backgroundColor,
            borderRadius: CLIP_RADIUS,
            borderColor: edge,
            borderWidth: RIM,
            borderBottomWidth: RIM + (pressed ? 0 : LIP),
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={action.icon} size={20} color={action.color} />
          {action.label && (
            <Text style={{ color: action.color, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 4 }}>
              {action.label}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function SwipeableRow({ children, rightActions, leftActions, enabled = true }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  // Where the row rests: 0 when closed, or the width of the open actions (negative on the right)
  const [offset, setOffset] = useState(0);

  const rightWidth = (rightActions?.length ?? 0) * ACTION_WIDTH;
  const leftWidth = (leftActions?.length ?? 0) * ACTION_WIDTH;

  const snapTo = useCallback((toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
    setOffset(toValue);
  }, [translateX]);

  const close = useCallback(() => snapTo(0), [snapTo]);
  const { lockProps, unlock } = useTabSwipeLock();

  // A gesture-handler pan, so inside the tab pager the row takes a horizontal swipe before the pager does.
  // It only activates in a direction it can move, leaving the others to the pager.
  const canMoveLeft = rightWidth > 0 || offset > 0;
  const canMoveRight = leftWidth > 0 || offset < 0;
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([canMoveLeft ? -ACTIVATE_DISTANCE : -NEVER, canMoveRight ? ACTIVATE_DISTANCE : NEVER])
    .failOffsetX([canMoveLeft ? -NEVER : -ACTIVATE_DISTANCE, canMoveRight ? NEVER : ACTIVATE_DISTANCE])
    .failOffsetY([-ACTIVATE_DISTANCE, ACTIVATE_DISTANCE])
    .onUpdate((e) => {
      // Clamp to the action widths, which are 0 on a side without actions
      translateX.setValue(Math.min(Math.max(offset + e.translationX, -rightWidth), leftWidth));
    })
    .onEnd((e) => {
      const position = offset + e.translationX;
      if (position < -SWIPE_THRESHOLD && rightWidth > 0) snapTo(-rightWidth);
      else if (position > SWIPE_THRESHOLD && leftWidth > 0) snapTo(leftWidth);
      else snapTo(0);
    })
    .onFinalize(unlock);

  if (!enabled || (!rightActions?.length && !leftActions?.length)) {
    return <>{children}</>;
  }

  return (
    <View style={{ position: 'relative', overflow: 'hidden', borderRadius: CLIP_RADIUS, marginBottom: 8 }}>
      {/* Right actions (revealed when swiping left) */}
      {rightActions && rightActions.length > 0 && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: 'row',
            width: rightWidth,
          }}
        >
          {rightActions.map((action, index) => (
            <ActionTile key={index} action={action} side="right" onPress={() => { close(); action.onPress(); }} />
          ))}
        </View>
      )}

      {/* Left actions (revealed when swiping right) */}
      {leftActions && leftActions.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            flexDirection: 'row',
            width: leftWidth,
          }}
        >
          {leftActions.map((action, index) => (
            <ActionTile key={index} action={action} side="left" onPress={() => { close(); action.onPress(); }} />
          ))}
        </View>
      )}

      {/* Main content */}
      <GestureDetector gesture={pan}>
        <Animated.View style={{ transform: [{ translateX }] }} {...lockProps}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
