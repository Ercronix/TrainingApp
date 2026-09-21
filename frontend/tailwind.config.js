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
      },
    },
  },
  plugins: [],
};
