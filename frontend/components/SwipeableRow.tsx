import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { blendHex } from '@/utils/color';

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
  const lastOffset = useRef(0);

  const rightWidth = (rightActions?.length ?? 0) * ACTION_WIDTH;
  const leftWidth = (leftActions?.length ?? 0) * ACTION_WIDTH;

  // The pan responder is created once, so it reads the actions through a ref to see prop changes
  const actions = useRef({ rightActions, leftActions, rightWidth, leftWidth });
  actions.current = { rightActions, leftActions, rightWidth, leftWidth };

  const close = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
    lastOffset.current = 0;
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
      },
      onPanResponderGrant: () => {
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const { rightActions, leftActions, rightWidth, leftWidth } = actions.current;
        let newValue = gestureState.dx;
        const total = lastOffset.current + newValue;

        // Clamp: don't go beyond action widths
        if (total < -rightWidth) newValue = -rightWidth - lastOffset.current;
        if (total > leftWidth) newValue = leftWidth - lastOffset.current;
        // Don't allow swiping in a direction with no actions
        if (!rightActions?.length && total < 0) newValue = -lastOffset.current;
        if (!leftActions?.length && total > 0) newValue = -lastOffset.current;

        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { rightActions, leftActions, rightWidth, leftWidth } = actions.current;
        translateX.flattenOffset();
        const currentPos = lastOffset.current + gestureState.dx;

        let toValue = 0;
        if (currentPos < -SWIPE_THRESHOLD && rightActions?.length) {
          toValue = -rightWidth;
        } else if (currentPos > SWIPE_THRESHOLD && leftActions?.length) {
          toValue = leftWidth;
        }

        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }).start();
        lastOffset.current = toValue;
      },
    })
  ).current;

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
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
