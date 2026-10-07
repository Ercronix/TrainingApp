import { Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import type { ReactNode, Ref } from 'react';

type Variant = 'accent' | 'surface' | 'elevated' | 'danger';

// Face and lip colors; the lip is the face's bottom border. Neutral faces also get a 2px rim.
const VARIANTS: Record<Variant, { className: string; rim: number }> = {
  accent: { className: 'bg-accent border-accent-lip', rim: 0 },
  surface: { className: 'bg-surface border-2 border-edge', rim: 2 },
  elevated: { className: 'bg-elevated border-2 border-edge', rim: 2 },
  danger: { className: 'bg-danger-muted border-2 border-danger-lip', rim: 2 },
};

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  variant?: Variant;
  /** Classes of the face: shape, padding, layout. Margins and flex sizing go in `containerClassName`. */
  className?: string;
  containerClassName?: string;
  /** Lip height in px. */
  depth?: number;
  /** Extra style of the face. */
  style?: StyleProp<ViewStyle>;
  /** Kept for drop-in replacement of TouchableOpacity; the press is shown by sinking instead. */
  activeOpacity?: number;
  ref?: Ref<View>;
}

/**
 * A chunky button that stands on a lip and sinks into it while pressed. The total height stays
 * the same, so nothing around it moves.
 */
export function Tactile({
  children, variant = 'accent', className = '', containerClassName = '', depth = 4, disabled, style, ref, activeOpacity: _, ...rest
}: Props) {
  return (
    <Pressable {...rest} ref={ref} disabled={disabled} className={containerClassName}>
      {({ pressed }) => {
        const down = pressed && !disabled;
        const { className: face, rim } = VARIANTS[variant];
        return (
          <View
            className={`${face} ${className}`}
            style={[style, { borderBottomWidth: rim + (down ? 0 : depth), marginTop: down ? depth : 0 }]}
          >
            {children}
          </View>
        );
      }}
    </Pressable>
  );
}
