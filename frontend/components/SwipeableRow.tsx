import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

export default function SwipeableRow({ children, rightActions, leftActions, enabled = true }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const rightWidth = (rightActions?.length ?? 0) * ACTION_WIDTH;
  const leftWidth = (leftActions?.length ?? 0) * ACTION_WIDTH;

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
    <View style={{ position: 'relative', overflow: 'hidden', borderRadius: 6, marginBottom: 8 }}>
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
            <TouchableOpacity
              key={index}
              onPress={() => { close(); action.onPress(); }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor: action.backgroundColor,
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
            </TouchableOpacity>
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
            <TouchableOpacity
              key={index}
              onPress={() => { close(); action.onPress(); }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor: action.backgroundColor,
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
            </TouchableOpacity>
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
