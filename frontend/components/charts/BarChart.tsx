import { View, Text, LayoutChangeEvent } from 'react-native';
import { useState } from 'react';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { CHART_FONT, compactTick, linearScale, niceTicks, scrubHandlers } from './scale';

export interface Bar {
  label: string;
  value: number;
  /** Shown in the readout, e.g. the full date range of a week. */
  detail?: string;
  /** Drawn faded, e.g. the week still in progress. */
  partial?: boolean;
}

interface Props {
  bars: Bar[];
  formatValue: (v: number) => string;
  height?: number;
  /** Bar shown in the readout when nothing is touched (default: last). */
  defaultIndex?: number;
  /** Draw a label under every n-th bar. */
  labelEvery?: number;
  /** Dashed reference line, e.g. an average. */
  reference?: { value: number; label: string };
}

const PAD = { top: 8, right: 4, bottom: 20, left: 36 };

/** Rectangle with rounded top corners, anchored to the baseline. */
function barPath(x: number, top: number, w: number, bottom: number): string {
  const r = Math.min(4, w / 2, bottom - top);
  return `M${x},${bottom} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + w - r},${top} Q${x + w},${top} ${x + w},${top + r} L${x + w},${bottom} Z`;
}

export function BarChart({ bars, formatValue, height = 150, defaultIndex, labelEvery = 1, reference }: Props) {
  const c = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const max = Math.max(...bars.map((b) => b.value), reference?.value ?? 0);
  const ticks = niceTicks(0, max > 0 ? max : 1, 3);
  const y = linearScale(0, ticks[ticks.length - 1], height - PAD.bottom, PAD.top);
  const slot = (width - PAD.left - PAD.right) / bars.length;
  const barWidth = Math.max(2, Math.min(28, slot - 4));
  const shown = selected ?? defaultIndex ?? bars.length - 1;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const selectAt = (px: number) =>
    setSelected(Math.max(0, Math.min(bars.length - 1, Math.floor((px - PAD.left) / slot))));

  return (
    <View>
      <View className="flex-row justify-between items-end mb-2 min-h-[34px]">
        <View>
          <Text className="text-primary text-lg font-mono-bold tracking-tight">{formatValue(bars[shown].value)}</Text>
          <Text className="text-muted text-[10px] tracking-wider">{bars[shown].detail ?? bars[shown].label}</Text>
        </View>
        {reference && (
          <View className="items-end">
            <Text className="text-muted text-sm font-mono-bold">{formatValue(reference.value)}</Text>
            <Text className="text-muted text-[10px] tracking-wider">{reference.label}</Text>
          </View>
        )}
      </View>

      <View onLayout={onLayout} style={{ height }} {...scrubHandlers(selectAt, () => setSelected(null))}>
        {width > 0 && (
          <Svg width={width} height={height} pointerEvents="none">
            {ticks.map((t) => (
              <Line key={`g${t}`} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={c.subtle} strokeWidth={1} />
            ))}
            {ticks.map((t) => (
              <SvgText key={`l${t}`} x={PAD.left - 6} y={y(t) + 3} fontSize={9} fill={c.muted} textAnchor="end" fontFamily={CHART_FONT}>
                {compactTick(t)}
              </SvgText>
            ))}
            {bars.map((b, i) => {
              const bx = PAD.left + i * slot + (slot - barWidth) / 2;
              return (
                <Path
                  key={i}
                  d={b.value > 0 ? barPath(bx, y(b.value), barWidth, y(0)) : ''}
                  fill={c.accentText}
                  fillOpacity={i === shown ? 1 : b.partial ? 0.35 : 0.7}
                />
              );
            })}
            {reference && reference.value > 0 && (
              <Line x1={PAD.left} x2={width - PAD.right} y1={y(reference.value)} y2={y(reference.value)} stroke={c.primary} strokeOpacity={0.6} strokeWidth={1} strokeDasharray="3 3" />
            )}
            {bars.map((b, i) =>
              i % labelEvery === (bars.length - 1) % labelEvery ? (
                <SvgText key={`x${i}`} x={PAD.left + i * slot + slot / 2} y={height - 6} fontSize={9} fill={i === shown ? c.primary : c.muted} textAnchor="middle" fontFamily={CHART_FONT}>
                  {b.label}
                </SvgText>
              ) : null,
            )}
          </Svg>
        )}
      </View>
    </View>
  );
}
