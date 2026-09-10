const tokens = require('./theme.tokens');

function toKebab(key) {
  return key.replace(/([A-Z0-9]+)/g, '-$1').toLowerCase();
}

function buildColors() {
  const colors = {};
  for (const key of Object.keys(tokens.scheme.light)) {
    const kebab = toKebab(key);
    colors[kebab] = tokens.scheme.light[key];
    colors[`${kebab}-dark`] = tokens.scheme.dark[key];
  }
  for (const key of Object.keys(tokens.constant)) {
    colors[toKebab(key)] = tokens.constant[key];
  }
  return colors;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,web.tsx,web.jsx}",
    "./components/**/*.{js,jsx,ts,tsx,web.tsx,web.jsx}"
  ],
  darkMode: 'media',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: buildColors(),
    },
  },
  plugins: [],
};
