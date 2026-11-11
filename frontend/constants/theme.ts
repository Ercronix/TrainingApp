import { Platform } from 'react-native';
import { vars } from 'nativewind';
import { blendHex, contrastTextColor } from '@/utils/color';

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
  /** Translucent cards over an aurora backdrop instead of solid, raised ones. */
  glass?: boolean;
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
  {
    // Nord — https://www.nordtheme.com/docs/colors-and-palettes
    id: 'nord',
    name: 'Nord',
    dark: {
      accent:       '#88c0d0', // frost
      accentFg:     '#2e3440', // nord0
      accentText:   '#88c0d0',
      accentMuted:  '#33424f',
      primary:      '#eceff4', // nord6
      muted:        '#8b95ab',
      subtle:       '#434c5e', // nord2
      dim:          '#3b4252', // nord1
      danger:       '#bf616a', // nord11
      dangerMuted:  '#3b2a30',
      info:         '#81a1c1', // nord9
      base:         '#2e3440', // nord0
      surface:      '#3b4252', // nord1
      elevated:     '#434c5e', // nord2
      surfaceDone:  '#26332c',
      border:       '#3b4252',
    },
    light: {
      accent:       '#5e81ac', // nord10
      accentFg:     '#eceff4', // nord6
      accentText:   '#5e81ac',
      accentMuted:  '#e3ebf3',
      primary:      '#2e3440', // nord0
      muted:        '#4c566a', // nord3
      subtle:       '#9aa5b5',
      dim:          '#e5e9f0', // nord5
      danger:       '#bf616a', // nord11
      dangerMuted:  '#f7e3e6',
      info:         '#5e81ac',
      base:         '#eceff4', // nord6
      surface:      '#ffffff',
      elevated:     '#e5e9f0', // nord5
      surfaceDone:  '#e6f2e8',
      border:       '#e5e9f0',
    },
  },
  {
    // Gruvbox — https://github.com/morhetz/gruvbox
    id: 'gruvbox',
    name: 'Gruvbox',
    dark: {
      accent:       '#fe8019', // bright orange
      accentFg:     '#282828', // bg0
      accentText:   '#fe8019',
      accentMuted:  '#3d2b1f',
      primary:      '#ebdbb2', // fg1
      muted:        '#a89984', // fg4
      subtle:       '#665c54', // bg3
      dim:          '#3c3836', // bg1
      danger:       '#fb4934', // bright red
      dangerMuted:  '#3d2420',
      info:         '#83a598', // bright blue
      base:         '#282828', // bg0
      surface:      '#3c3836', // bg1
      elevated:     '#504945', // bg2
      surfaceDone:  '#2b3328',
      border:       '#3c3836',
    },
    light: {
      accent:       '#d65d0e', // neutral orange
      accentFg:     '#fbf1c7', // bg0
      accentText:   '#d65d0e',
      accentMuted:  '#f3e0cc',
      primary:      '#3c3836', // fg1
      muted:        '#7c6f64', // fg4
      subtle:       '#a89984', // bg4
      dim:          '#ebdbb2', // bg1
      danger:       '#cc241d', // neutral red
      dangerMuted:  '#f7dcd7',
      info:         '#458588', // neutral blue
      base:         '#fbf1c7', // bg0
      surface:      '#ffffff',
      elevated:     '#ebdbb2', // bg1
      surfaceDone:  '#e8f0d8',
      border:       '#ebdbb2',
    },
  },
  {
    // Rosé Pine / Dawn — https://rosepinetheme.com/palette
    id: 'rosepine',
    name: 'Rosé Pine',
    dark: {
      accent:       '#c4a7e7', // iris
      accentFg:     '#191724', // base
      accentText:   '#c4a7e7',
      accentMuted:  '#403d52', // highlightMed
      primary:      '#e0def4', // text
      muted:        '#908caa', // subtle
      subtle:       '#6e6a86', // muted
      dim:          '#26233a', // overlay
      danger:       '#eb6f92', // love
      dangerMuted:  '#3a2530',
      info:         '#9ccfd8', // foam
      base:         '#191724', // base
      surface:      '#1f1d2e', // surface
      elevated:     '#26233a', // overlay
      surfaceDone:  '#20302a',
      border:       '#1f1d2e',
    },
    light: {
      accent:       '#907aa9', // iris
      accentFg:     '#faf4ed', // base
      accentText:   '#907aa9',
      accentMuted:  '#dfdad9', // highlightMed
      primary:      '#575279', // text
      muted:        '#797593', // subtle
      subtle:       '#9893a5', // muted
      dim:          '#f2e9e1', // overlay
      danger:       '#b4637a', // love
      dangerMuted:  '#f6e2e6',
      info:         '#56949f', // foam
      base:         '#faf4ed', // base
      surface:      '#fffaf3', // surface
      elevated:     '#f2e9e1', // overlay
      surfaceDone:  '#e8f0e4',
      border:       '#f2e9e1',
    },
  },
  {
    // Everforest — https://github.com/sainnhe/everforest
    id: 'everforest',
    name: 'Everforest',
    dark: {
      accent:       '#a7c080', // green
      accentFg:     '#2d353b', // bg0
      accentText:   '#a7c080',
      accentMuted:  '#2f3b34',
      primary:      '#d3c6aa', // fg
      muted:        '#9da9a0', // grey2
      subtle:       '#859289', // grey1
      dim:          '#343f44', // bg1
      danger:       '#e67e80', // red
      dangerMuted:  '#3a2b2b',
      info:         '#7fbbb3', // blue
      base:         '#2d353b', // bg0
      surface:      '#343f44', // bg1
      elevated:     '#3d484d', // bg2
      surfaceDone:  '#2c3830',
      border:       '#343f44',
    },
    light: {
      accent:       '#8da101', // green
      accentFg:     '#fdf6e3', // bg0
      accentText:   '#8da101',
      accentMuted:  '#eaf0d6',
      primary:      '#5c6a72', // fg
      muted:        '#829181', // grey2
      subtle:       '#939f91', // grey1
      dim:          '#f4f0d9', // bg1
      danger:       '#f85552', // red
      dangerMuted:  '#fbdedd',
      info:         '#3a94c5', // blue
      base:         '#fdf6e3', // bg0
      surface:      '#ffffff',
      elevated:     '#f4f0d9', // bg1
      surfaceDone:  '#e6f0d8',
      border:       '#f4f0d9',
    },
  },
  {
    // Glass: translucent cards over an aurora, after a Hyprland desktop with a matugen palette.
    // The colors here are the solid stand-ins that code blends with; the cards themselves get
    // translucent versions in getThemeVars.
    id: 'glass',
    name: 'Glass',
    glass: true,
    dark: {
      accent:       '#a5f7c9',
      accentFg:     '#05170f',
      accentText:   '#a5f7c9',
      accentMuted:  '#1c3a2e',
      primary:      '#eef5f0',
      muted:        '#a3b8ae',
      subtle:       '#5d7268',
      dim:          '#17261f',
      danger:       '#ff716c',
      dangerMuted:  '#3a1c1a',
      info:         '#9ff3f9',
      base:         '#06110d',
      surface:      '#0c1a15',
      elevated:     '#1a2b24',
      surfaceDone:  '#0f2a1e',
      border:       '#0c1a15',
    },
    light: {
      accent:       '#1f9d6b',
      accentFg:     '#ffffff',
      accentText:   '#0f6945',
      accentMuted:  '#cfeadd',
      primary:      '#0b1f17',
      muted:        '#4d6359',
      subtle:       '#9db3a9',
      dim:          '#d3e2da',
      danger:       '#c8322d',
      dangerMuted:  '#f9dedc',
      info:         '#00707a',
      base:         '#d6e8df',
      surface:      '#f4faf7',
      elevated:     '#e0ede6',
      surfaceDone:  '#d9f1e3',
      border:       '#e0ede6',
    },
  },
];

export const DEFAULT_THEME_ID = THEMES[0].id;

export function getTheme(themeId: string): Theme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}

/** Overrides a palette's accent-derived tokens with a custom accent color, pywal-style. */
export function applyCustomAccent(c: ColorPalette, customAccent: string | null | undefined): ColorPalette {
  if (!customAccent) return c;
  return {
    ...c,
    accent: customAccent,
    accentFg: contrastTextColor(customAccent),
    accentText: customAccent,
    accentMuted: blendHex(customAccent, c.base, 0.2),
  };
}

/** A palette plus the edge colors of the chunky, raised look, derived so every theme gets them. */
export interface Palette extends ColorPalette {
  /** Bottom lip of accent buttons. */
  accentLip: string;
  /** Bottom lip of danger buttons. */
  dangerLip: string;
  /** Outline and lip of cards and neutral buttons. */
  edge: string;
  /** Outline and lip of done cards. */
  edgeDone: string;
  /** Whether the theme draws translucent cards over the aurora (see `Theme.glass`). */
  glass: boolean;
}

const BLACK = '#000000';

function withEdges(c: ColorPalette, glass: boolean): Palette {
  return {
    ...c,
    glass,
    accentLip: blendHex(c.accent, BLACK, 0.62),
    dangerLip: blendHex(c.danger, BLACK, 0.62),
    // Toward the text color, so it reads as a raised rim in both dark and light mode
    edge: blendHex(c.primary, c.surface, 0.1),
    edgeDone: blendHex(c.accent, c.surfaceDone, 0.25),
  };
}

export function getPalette(themeId: string, mode: 'light' | 'dark', customAccent?: string | null): Palette {
  const theme = getTheme(themeId);
  return withEdges(applyCustomAccent(theme[mode], customAccent), !!theme.glass);
}

export const DEFAULT_GLASS_OPACITY = 0.5;
export const GLASS_OPACITY_MIN = 0.2;
export const GLASS_OPACITY_MAX = 0.9;

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.min(1, Math.max(0, alpha)).toFixed(2)})`;
}

// Border widths of cards: a rim with a thicker bottom lip, or a hairline on glass. The web needs
// a unit, the native runtime a number.
const px = (n: number) => (Platform.OS === 'web' ? `${n}px` : n);

export function getThemeVars(
  themeId: string,
  mode: 'light' | 'dark',
  customAccent?: string | null,
  glassOpacity = DEFAULT_GLASS_OPACITY,
) {
  const c = getPalette(themeId, mode, customAccent);
  if (c.glass) {
    // The screens are see-through down to the aurora (see AuroraBackdrop) and the cards are tinted
    // panes on it. Tints of the text color stand in for the raised surfaces inside a card.
    const ink = mode === 'dark' ? '#ffffff' : '#000000';
    return vars({
      '--color-accent':       c.accent,
      '--color-accent-fg':    c.accentFg,
      '--color-accent-text':  c.accentText,
      '--color-accent-muted': rgba(c.accent, mode === 'dark' ? 0.16 : 0.22),
      '--color-primary':      c.primary,
      '--color-muted':        c.muted,
      '--color-subtle':       c.subtle,
      '--color-dim':          rgba(ink, 0.08),
      '--color-danger':       c.danger,
      '--color-danger-muted': rgba(c.danger, 0.16),
      '--color-info':         c.info,
      '--color-base':         'transparent',
      '--color-surface':      rgba(c.surface, glassOpacity),
      '--color-elevated':     rgba(ink, mode === 'dark' ? 0.08 : 0.06),
      '--color-surface-done': rgba(c.surfaceDone, Math.min(1, glassOpacity + 0.1)),
      '--color-border':       rgba(ink, 0.08),
      '--color-accent-lip':   c.accentLip,
      '--color-danger-lip':   rgba(c.danger, 0.5),
      '--color-edge':         rgba(ink, mode === 'dark' ? 0.1 : 0.12),
      '--color-edge-done':    rgba(c.accent, 0.35),
      // Bars and toasts that float over scrolling content stay nearly opaque, so it doesn't show through
      '--color-dock':         rgba(c.base, 0.94),
      '--color-surface-solid': rgba(c.surface, 0.94),
      // Fields and stat strips set into a card: a darker pane in dark mode, a frosted one in light
      '--color-inset':        mode === 'dark' ? rgba('#000000', 0.22) : rgba('#ffffff', 0.45),
      '--rim':                px(1),
      '--lip':                px(1),
      '--lip-sm':             px(1),
    });
  }
  return vars({
    '--rim':                px(2),
    '--lip':                px(6),
    '--lip-sm':             px(4),
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
    '--color-accent-lip':   c.accentLip,
    '--color-danger-lip':   c.dangerLip,
    '--color-edge':         c.edge,
    '--color-edge-done':    c.edgeDone,
    '--color-dock':         c.base,
    '--color-surface-solid': c.surface,
    '--color-inset':        c.base,
  });
}
