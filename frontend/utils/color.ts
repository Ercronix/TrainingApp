export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Relative luminance (WCAG), used to decide readable text color on a swatch. */
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Picks near-black or near-white text for readable contrast against `hex`. */
export function contrastTextColor(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? '#0e0e0e' : '#ffffff';
}

/** Blends `hex` into `baseHex` by `amount` (0 = pure base, 1 = pure hex). */
export function blendHex(hex: string, baseHex: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(baseHex);
  return rgbToHex(
    b.r + (a.r - b.r) * amount,
    b.g + (a.g - b.g) * amount,
    b.b + (a.b - b.b) * amount,
  );
}
