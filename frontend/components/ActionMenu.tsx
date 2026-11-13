import { useRef, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/haptics';

export interface MenuAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface Props {
  actions: MenuAction[];
  /** Read by screen readers, e.g. "Options for Push Day". */
  accessibilityLabel?: string;
  disabled?: boolean;
}

const MENU_WIDTH = 190;
const ITEM_HEIGHT = 46;
const MARGIN = 8;

/**
 * A "⋮" button that opens a small menu of the row's actions next to it.
 * Put it inside the row, beside the row's own tap target, so tapping it doesn't open the row.
 */
export function ActionMenu({ actions, accessibilityLabel = 'More options', disabled }: Props) {
  const c = useTheme();
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';
  const { width, height } = useWindowDimensions();
  const button = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const open = () => {
    haptics.tap();
    button.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  };
  const close = () => setAnchor(null);

  if (actions.length === 0) return null;

  // Right-aligned under the button, or above it when there is no room below
  const menuHeight = actions.length * ITEM_HEIGHT + 8;
  const left = anchor ? Math.min(Math.max(anchor.x + anchor.w - MENU_WIDTH, MARGIN), width - MENU_WIDTH - MARGIN) : 0;
  const below = anchor ? anchor.y + anchor.h + 4 : 0;
  const top = anchor && below + menuHeight > height - MARGIN ? Math.max(anchor.y - menuHeight - 4, MARGIN) : below;

  return (
    <>
      <Pressable
        ref={button}
        onPress={open}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="w-9 h-9 rounded-full justify-center items-center"
        style={({ pressed }) => ({ backgroundColor: pressed ? c.elevated : 'transparent', opacity: disabled ? 0.4 : 1 })}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={c.muted} />
      </Pressable>

      <Modal visible={anchor != null} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close menu">
          <View
            accessibilityRole="menu"
            style={{
              position: 'absolute',
              top,
              left,
              width: MENU_WIDTH,
              paddingVertical: 4,
              backgroundColor: c.surface,
              borderRadius: 16,
              // Raised like the cards, or a hairline in a glass theme
              borderWidth: c.glass ? 1 : 2,
              borderBottomWidth: c.glass ? 1 : 4,
              borderColor: c.glass ? (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)') : c.edge,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            {actions.map((action) => {
              const color = action.destructive ? c.danger : c.primary;
              return (
                <Pressable
                  key={action.label}
                  accessibilityRole="menuitem"
                  onPress={() => {
                    close();
                    action.onPress();
                  }}
                  style={({ pressed }) => ({
                    height: ITEM_HEIGHT,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    backgroundColor: pressed ? (action.destructive ? c.dangerMuted : c.elevated) : 'transparent',
                  })}
                >
                  <Ionicons name={action.icon} size={18} color={action.destructive ? c.danger : c.muted} />
                  <Text style={{ color, fontSize: 15, fontWeight: '600' }}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
