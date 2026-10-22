import { useColorScheme } from 'nativewind';
import { getPalette } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const themeId = useThemeStore((s) => s.themeId);
  const customAccent = useThemeStore((s) => s.customAccent);
  const mode: 'light' | 'dark' = colorScheme === 'light' ? 'light' : 'dark';
  // The keyboard follows the mode too (iOS only), so light themes don't get a dark one
  return { ...getPalette(themeId, mode, customAccent), keyboardAppearance: mode };
}
