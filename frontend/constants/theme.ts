import { vars } from 'nativewind';

export interface ColorPalette {
  accent: string;
  accentFg: string;
  accentText: string;
  accentMuted: string;
  primary: string;
  muted: string;
  subtle: string;
  dim: string;
  danger: string;
  dangerMuted: string;
  info: string;
  base: string;
  surface: string;
  elevated: string;
  surfaceDone: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  dark: ColorPalette;
  light: ColorPalette;
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    dark: {
      accent:       '#cafd00',
      accentFg:     '#0e0e0e',
      accentText:   '#cafd00',
      accentMuted:  '#1a2200',
      primary:      '#f5f5f5',
      muted:        '#7a7a7a',
      subtle:       '#262626',
      dim:          '#1a1a1a',
      danger:       '#ff734a',
      dangerMuted:  '#2a1410',
      info:         '#81ecff',
      base:         '#0e0e0e',
      surface:      '#131313',
      elevated:     '#1a1a1a',
      surfaceDone:  '#0d1408',
      border:       '#131313',
    },
    light: {
      accent:       '#cafd00',
      accentFg:     '#0e0e0e',
      accentText:   '#4d6600',
      accentMuted:  '#e8f5d0',
      primary:      '#111111',
      muted:        '#666666',
      subtle:       '#bbbbbb',
      dim:          '#d0d0d0',
      danger:       '#cc3300',
      dangerMuted:  '#ffe5de',
      info:         '#0088bb',
      base:         '#f0f0f0',
      surface:      '#ffffff',
      elevated:     '#e4e4e4',
      surfaceDone:  '#eef5e8',
      border:       '#e4e4e4',
    },
  },
  {
    // Catppuccin Mocha / Latte — https://catppuccin.com/palette
    id: 'catppuccin',
    name: 'Catppuccin',
    dark: {
      accent:       '#cba6f7', // mauve
      accentFg:     '#1e1e2e', // base
      accentText:   '#cba6f7', // mauve
      accentMuted:  '#2c2540',
      primary:      '#cdd6f4', // text
      muted:        '#a6adc8', // subtext0
      subtle:       '#6c7086', // overlay0
      dim:          '#45475a', // surface1
      danger:       '#f38ba8', // red
      dangerMuted:  '#3a2430',
      info:         '#89dceb', // sky
      base:         '#1e1e2e', // base
      surface:      '#313244', // surface0
      elevated:     '#45475a', // surface1
      surfaceDone:  '#1f2b22',
      border:       '#313244',
    },
    light: {
      accent:       '#8839ef', // mauve
      accentFg:     '#eff1f5', // base
      accentText:   '#8839ef', // mauve
      accentMuted:  '#ece3fb',
      primary:      '#4c4f69', // text
      muted:        '#6c6f85', // subtext0
      subtle:       '#9ca0b0', // overlay0
      dim:          '#e6e9ef', // mantle
      danger:       '#d20f39', // red
      dangerMuted:  '#fbdde3',
      info:         '#04a5e5', // sky
      base:         '#eff1f5', // base
      surface:      '#ffffff',
      elevated:     '#e6e9ef', // mantle
      surfaceDone:  '#e6f4e6',
      border:       '#e6e9ef',
    },
  },
  {
    // Tokyo Night / Tokyo Night Day — https://github.com/folke/tokyonight.nvim
    id: 'tokyonight',
    name: 'Tokyo Night',
    dark: {
      accent:       '#7aa2f7', // blue
      accentFg:     '#1a1b26', // bg
      accentText:   '#7aa2f7',
      accentMuted:  '#242b42',
      primary:      '#c0caf5', // fg
      muted:        '#a9b1d6', // fg_dark
      subtle:       '#565f89', // comment
      dim:          '#292e42', // bg_highlight
      danger:       '#f7768e', // red
      dangerMuted:  '#33232c',
      info:         '#7dcfff', // cyan
      base:         '#1a1b26', // bg
      surface:      '#20212e',
      elevated:     '#292e42', // bg_highlight
      surfaceDone:  '#1a2a22',
      border:       '#20212e',
    },
    light: {
      accent:       '#2e7de9', // blue
      accentFg:     '#e1e2e7', // bg
      accentText:   '#2e7de9',
      accentMuted:  '#dde6fa',
      primary:      '#343b58', // ink
      muted:        '#6172b0', // fg_dark
      subtle:       '#848cb5', // comment
      dim:          '#c4c8da', // bg_highlight
      danger:       '#f52a65', // red
      dangerMuted:  '#fbdde6',
      info:         '#007197', // cyan
      base:         '#e1e2e7', // bg
      surface:      '#ffffff',
      elevated:     '#c4c8da', // bg_highlight
      surfaceDone:  '#e2f0e2',
      border:       '#c4c8da',
    },
  },
];

export const DEFAULT_THEME_ID = THEMES[0].id;

export function getTheme(themeId: string): Theme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}

export function getPalette(themeId: string, mode: 'light' | 'dark'): ColorPalette {
  return getTheme(themeId)[mode];
}

export function getThemeVars(themeId: string, mode: 'light' | 'dark') {
  const c = getPalette(themeId, mode);
  return vars({
    '--color-accent':       c.accent,
    '--color-accent-fg':    c.accentFg,
    '--color-accent-text':  c.accentText,
    '--color-accent-muted': c.accentMuted,
    '--color-primary':      c.primary,
    '--color-muted':        c.muted,
    '--color-subtle':       c.subtle,
    '--color-dim':          c.dim,
    '--color-danger':       c.danger,
    '--color-danger-muted': c.dangerMuted,
    '--color-info':         c.info,
    '--color-base':         c.base,
    '--color-surface':      c.surface,
    '--color-elevated':     c.elevated,
    '--color-surface-done': c.surfaceDone,
    '--color-border':       c.border,
  });
}
