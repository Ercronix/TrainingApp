import { useColorScheme } from 'nativewind';
import { getPalette } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const themeId = useThemeStore((s) => s.themeId);
  const customAccent = useThemeStore((s) => s.customAccent);
  return getPalette(themeId, colorScheme === 'light' ? 'light' : 'dark', customAccent);
}
