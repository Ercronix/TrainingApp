import { GestureResponderEvent } from 'react-native';

/** Rounded axis ticks (1/2/5 × 10ⁿ steps) covering [min, max]. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const rough = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= Math.ceil(max / step) * step + step / 2; v += step) {
    // Avoid float noise like 0.30000000000000004
    ticks.push(Number(v.toPrecision(12)));
  }
  return ticks;
}

export function linearScale(d0: number, d1: number, r0: number, r1: number) {
  return (v: number) => (d1 === d0 ? (r0 + r1) / 2 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0));
}

export function compactTick(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${+(v / 1000).toFixed(1)}k`;
  return `${+v.toFixed(1)}`;
}

/** Responder props that report the touch x position while pressing or scrubbing. */
export function scrubHandlers(onX: (x: number) => void, onEnd?: () => void) {
  const report = (e: GestureResponderEvent) => onX(e.nativeEvent.locationX);
  return {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    // Let a parent ScrollView take over vertical scrolls
    onResponderTerminationRequest: () => true,
    onResponderGrant: report,
    onResponderMove: report,
    onResponderRelease: onEnd,
    onResponderTerminate: onEnd,
  };
}

export const CHART_FONT = 'JetBrainsMono_400Regular';
