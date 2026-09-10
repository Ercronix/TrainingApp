/**
 * Single source of truth for the app's color palette.
 * Plain JS (not TS) so tailwind.config.js can `require()` it directly.
 *
 * `scheme` holds tokens that differ between light and dark mode.
 * `constant` holds tokens that are identical in both modes (e.g. the lime
 * accent button fill always stays lime, regardless of theme).
 */

const scheme = {
  light: {
    canvas: '#F5F5F1',
    surface: '#FFFFFF',
    surface2: '#ECECE6',
    surfaceDone: '#E7F3D8',
    surfaceDanger: '#FBE3DC',
    surfaceAccent: '#EAF7C4',
    line: '#E1E1DA',
    ink: '#14140F',
    inkBody: '#4A4A43',
    inkMuted: '#6E6E66',
    inkSubtle: '#9A9A90',
    inkGhost: '#C7C7BE',
    inkFaint: '#F1F1EC',
    inkHint: '#D8D8D2',
    accent: '#5C7A00',
    accentTint: '#CAFD00',
    danger: '#C1471C',
    info: '#0E7C93',
  },
  dark: {
    canvas: '#0E0E0E',
    surface: '#131313',
    surface2: '#1A1A1A',
    surfaceDone: '#0D1408',
    surfaceDanger: '#2A1410',
    surfaceAccent: '#1A2200',
    line: '#2A2A2A',
    ink: '#F5F5F5',
    inkBody: '#ADAAAA',
    inkMuted: '#7A7A7A',
    inkSubtle: '#3A3A3A',
    inkGhost: '#262626',
    inkFaint: '#1A1A1A',
    inkHint: '#2A2A2A',
    accent: '#CAFD00',
    accentTint: '#F3FFCA',
    danger: '#FF734A',
    info: '#81ECFF',
  },
};

const constant = {
  accentSolid: '#CAFD00',
  accentInk: '#0E0E0E',
};

module.exports = { scheme, constant };
