import { useColorScheme } from 'nativewind';
import { darkColors, lightColors } from '@/constants/theme';

export function useTheme() {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'light' ? lightColors : darkColors;
}
