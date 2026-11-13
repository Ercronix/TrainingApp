import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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

interface Box { x: number; y: number; w: number; h: number }

const MENU_WIDTH = 200;
const ITEM_HEIGHT = 48;
const MARGIN = 8;
const GAP = 4;

/**
 * A "⋮" button that opens a small menu of the row's actions next to it.
 * Put it inside the row, beside the row's own tap target, so tapping it doesn't open the row.
 */
export function ActionMenu({ actions, accessibilityLabel = 'More options', disabled }: Props) {
  const c = useTheme();
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';
  const button = useRef<View>(null);
  const overlay = useRef<View>(null);
  // The button and the overlay are measured in the same window coordinates, and the menu is placed
  // by their difference: on Android the modal and the screen can disagree about the status bar.
  const [anchor, setAnchor] = useState<Box | null>(null);
  const [frame, setFrame] = useState<Box | null>(null);

  const open = () => {
    haptics.tap();
    button.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  };
  const close = () => {
    setAnchor(null);
    setFrame(null);
  };

  if (actions.length === 0) return null;

  let position: { top: number; left: number } | null = null;
  if (anchor && frame) {
    const x = anchor.x - frame.x;
    const y = anchor.y - frame.y;
    const menuHeight = actions.length * ITEM_HEIGHT + 12;
    const left = Math.min(Math.max(x + anchor.w - MENU_WIDTH, MARGIN), frame.w - MENU_WIDTH - MARGIN);
    // Under the button, or above it when there is no room below
    const below = y + anchor.h + GAP;
    const top = below + menuHeight > frame.h - MARGIN ? Math.max(y - menuHeight - GAP, MARGIN) : below;
    position = { top, left };
  }

  return (
    <>
      <Pressable
        ref={button}
        onPress={open}
        disabled={disabled}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {({ pressed }) => (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed || anchor ? c.elevated : 'transparent',
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={c.muted} />
          </View>
        )}
      </Pressable>

      <Modal visible={anchor != null} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <View
          ref={overlay}
          style={StyleSheet.absoluteFill}
          onLayout={() => overlay.current?.measureInWindow((x, y, w, h) => setFrame({ x, y, w, h }))}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close menu" />
          {position && (
            <View
              accessibilityRole="menu"
              style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                width: MENU_WIDTH,
                padding: 4,
                backgroundColor: c.surface,
                borderRadius: 18,
                // Raised like the cards, or a hairline in a glass theme
                borderWidth: c.glass ? 1 : 2,
                borderBottomWidth: c.glass ? 1 : 4,
                borderColor: c.glass ? (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)') : c.edge,
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 12,
              }}
            >
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  accessibilityRole="menuitem"
                  onPress={() => {
                    close();
                    action.onPress();
                  }}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        height: ITEM_HEIGHT,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: pressed ? (action.destructive ? c.dangerMuted : c.elevated) : 'transparent',
                      }}
                    >
                      <Ionicons
                        name={action.icon}
                        size={18}
                        color={action.destructive ? c.danger : c.muted}
                        style={{ width: 22, marginRight: 12 }}
                      />
                      <Text style={{ color: action.destructive ? c.danger : c.primary, fontSize: 15, fontWeight: '600' }}>
                        {action.label}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
