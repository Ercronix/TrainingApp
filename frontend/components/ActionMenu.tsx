import { createContext, useContext, useEffect, useState } from 'react';
import { Pressable, Text, View, ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/haptics';

export interface MenuAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface MenuState {
  open: MenuAction[] | null;
  setOpen: (actions: MenuAction[] | null) => void;
}

const MenuContext = createContext<MenuState | null>(null);

interface CardProps extends ViewProps {
  /** The card itself: background, rim, radius, margin. */
  className?: string;
  /** Layout of the card's contents (e.g. `flex-row items-center pr-3`). */
  contentClassName?: string;
}

/**
 * A card whose contents an `ActionMenu` inside it swaps for the row's actions, in place.
 * The contents are hidden rather than covered, so the card keeps its size and its own
 * background (translucent in a glass theme) shows behind the actions.
 */
export function ActionCard({ className, contentClassName, children, ...rest }: CardProps) {
  const c = useTheme();
  const [open, setOpen] = useState<MenuAction[] | null>(null);

  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      <View className={`overflow-hidden ${className ?? ''}`} {...rest}>
        <View
          className={contentClassName}
          style={open ? { opacity: 0 } : undefined}
          pointerEvents={open ? 'none' : 'auto'}
          accessibilityElementsHidden={open != null}
          importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
        >
          {children}
        </View>
        {open && (
          <View accessibilityRole="menu" className="absolute inset-0 flex-row items-center gap-2 px-3">
            {open.map((action) => (
              <Pressable
                key={action.label}
                className="flex-1"
                accessibilityRole="menuitem"
                onPress={() => {
                  setOpen(null);
                  action.onPress();
                }}
              >
                {({ pressed }) => (
                  <View
                    className={`h-11 flex-row items-center justify-center gap-2 rounded ${action.destructive ? 'bg-danger-muted' : 'bg-elevated'}`}
                    style={{ opacity: pressed ? 0.7 : 1 }}
                  >
                    <Ionicons name={action.icon} size={18} color={action.destructive ? c.danger : c.primary} />
                    <Text
                      style={{ color: action.destructive ? c.danger : c.primary, fontSize: 15, fontWeight: '600' }}
                      numberOfLines={1}
                    >
                      {action.label}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
            <Pressable
              onPress={() => setOpen(null)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              className="w-9 h-9 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={20} color={c.muted} />
            </Pressable>
          </View>
        )}
      </View>
    </MenuContext.Provider>
  );
}

interface Props {
  actions: MenuAction[];
  /** Read by screen readers, e.g. "Options for Push Day". */
  accessibilityLabel?: string;
  disabled?: boolean;
}

/**
 * A "⋮" button that replaces the contents of its `ActionCard` with the row's actions.
 * Put it inside the row, beside the row's own tap target, so tapping it doesn't open the row.
 */
export function ActionMenu({ actions, accessibilityLabel = 'More options', disabled }: Props) {
  const c = useTheme();
  const menu = useContext(MenuContext);
  if (!menu) throw new Error('ActionMenu must be inside an ActionCard');
  const setOpen = menu.setOpen;
  // Don't leave the actions showing once the button is gone (e.g. in reorder mode)
  useEffect(() => () => setOpen(null), [setOpen]);
  if (actions.length === 0) return null;

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        menu.setOpen(actions);
      }}
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
            backgroundColor: pressed ? c.elevated : 'transparent',
            opacity: disabled ? 0.4 : 1,
          }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={c.muted} />
        </View>
      )}
    </Pressable>
  );
}
