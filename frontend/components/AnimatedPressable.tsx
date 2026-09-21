import React, { forwardRef, useRef } from 'react';
import { View, Animated, TouchableOpacity, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';

interface AnimatedPressableProps extends TouchableOpacityProps {
  /** className for the non-animated outer wrapper — use for absolute positioning. */
  wrapperClassName?: string;
  wrapperStyle?: StyleProp<ViewStyle>;
}

/** TouchableOpacity with a snappy spring scale-down on press, for a more tactile feel. */
export const AnimatedPressable = forwardRef<React.ElementRef<typeof TouchableOpacity>, AnimatedPressableProps>(
  ({ wrapperClassName, wrapperStyle, style, onPressIn, onPressOut, children, ...rest }, ref) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn: TouchableOpacityProps['onPressIn'] = (e) => {
      Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
      onPressIn?.(e);
    };

    const handlePressOut: TouchableOpacityProps['onPressOut'] = (e) => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
      onPressOut?.(e);
    };

    return (
      <View className={wrapperClassName} style={wrapperStyle}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            ref={ref}
            {...rest}
            style={style}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            {children}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
);

AnimatedPressable.displayName = 'AnimatedPressable';
