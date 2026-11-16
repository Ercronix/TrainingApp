const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,web.tsx,web.jsx}",
    "./components/**/*.{js,jsx,ts,tsx,web.tsx,web.jsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        sm: '10px',
        md: '18px',
        lg: '24px',
      },
      fontFamily: {
        mono: ['JetBrainsMono_400Regular'],
        'mono-bold': ['JetBrainsMono_700Bold'],
      },
      colors: {
        accent:         'var(--color-accent)',
        'accent-fg':    'var(--color-accent-fg)',
        'accent-text':  'var(--color-accent-text)',
        'accent-muted': 'var(--color-accent-muted)',
        primary:        'var(--color-primary)',
        muted:          'var(--color-muted)',
        subtle:         'var(--color-subtle)',
        dim:            'var(--color-dim)',
        danger:         'var(--color-danger)',
        'danger-muted': 'var(--color-danger-muted)',
        info:           'var(--color-info)',
        base:           'var(--color-base)',
        surface:        'var(--color-surface)',
        elevated:       'var(--color-elevated)',
        'surface-done': 'var(--color-surface-done)',
        border:         'var(--color-border)',
        'accent-lip':   'var(--color-accent-lip)',
        'danger-lip':   'var(--color-danger-lip)',
        edge:           'var(--color-edge)',
        'edge-done':    'var(--color-edge-done)',
        // Opaque enough to cover content scrolling underneath, in a glass theme too
        dock:           'var(--color-dock)',
        'surface-solid': 'var(--color-surface-solid)',
        // Fields and strips set into a card (the base color, except in a glass theme)
        inset:          'var(--color-inset)',
      },
    },
  },
  plugins: [
    // The border of a card: a rim with a thicker bottom lip, or a hairline in the glass theme.
    // The widths come from the theme (see getThemeVars); pair it with a border color.
    plugin(({ addUtilities }) => {
      addUtilities({
        '.rim': { borderWidth: 'var(--rim)', borderBottomWidth: 'var(--lip)' },
        // The same with a smaller lip, for text fields and search bars
        '.rim-sm': { borderWidth: 'var(--rim)', borderBottomWidth: 'var(--lip-sm)' },
      });
    }),
  ],
};
