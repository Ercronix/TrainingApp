import { blendHex, contrastTextColor, isValidHex } from '@/utils/color';

describe('isValidHex', () => {
  it('accepts six-digit hex colors only', () => {
    expect(isValidHex('#a1B2c3')).toBe(true);
    expect(isValidHex('#fff')).toBe(false);
    expect(isValidHex('a1b2c3')).toBe(false);
    expect(isValidHex('#a1b2c3ff')).toBe(false);
    expect(isValidHex('#g1b2c3')).toBe(false);
  });
});

describe('contrastTextColor', () => {
  it('picks dark text on light colors and white on dark ones', () => {
    expect(contrastTextColor('#ffffff')).toBe('#0e0e0e');
    expect(contrastTextColor('#ffeb3b')).toBe('#0e0e0e');
    expect(contrastTextColor('#000000')).toBe('#ffffff');
    expect(contrastTextColor('#1e40af')).toBe('#ffffff');
  });
});

describe('blendHex', () => {
  it('interpolates from the base to the color', () => {
    expect(blendHex('#ffffff', '#000000', 0)).toBe('#000000');
    expect(blendHex('#ffffff', '#000000', 1)).toBe('#ffffff');
    expect(blendHex('#ffffff', '#000000', 0.5)).toBe('#808080');
    expect(blendHex('#ff0000', '#0000ff', 0.25)).toBe('#4000bf');
  });

  it('clamps amounts outside 0..1 to valid colors', () => {
    expect(blendHex('#ffffff', '#808080', 2)).toBe('#ffffff');
    expect(blendHex('#000000', '#808080', 2)).toBe('#000000');
  });
});
