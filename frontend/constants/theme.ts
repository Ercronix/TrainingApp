import { useColorScheme } from 'react-native';
import tokens from '../theme.tokens';

export type ThemeColors = typeof tokens.scheme.light & typeof tokens.constant;

const resolved: Record<'light' | 'dark', ThemeColors> = {
  light: { ...tokens.scheme.light, ...tokens.constant },
  dark: { ...tokens.scheme.dark, ...tokens.constant },
};

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return resolved[scheme === 'light' ? 'light' : 'dark'];
}
