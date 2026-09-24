import { View, Text, LayoutChangeEvent } from 'react-native';
import { useState } from 'react';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { CHART_FONT, compactTick, linearScale, niceTicks, scrubHandlers } from './scale';

export interface TrendPoint {
  x: number;
  y: number;
}

interface Props {
  points: TrendPoint[];
  /** Dashed continuation beyond the last point (e.g. a projected trend). */
  projection?: TrendPoint[];
  formatValue: (y: number) => string;
  formatX: (x: number) => string;
  /** Extra line under the value in the readout, per point. */
  describe?: (index: number) => string;
  height?: number;
  /** Ring the highest point. */
  markBest?: boolean;
}

const PAD = { top: 10, right: 14, bottom: 22, left: 40 };

export function TrendChart({ points, projection = [], formatValue, formatX, describe, height = 180, markBest = true }: Props) {
  const c = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const all = [...points, ...projection];
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const x = linearScale(Math.min(...xs), Math.max(...xs), PAD.left, width - PAD.right);
  const y = linearScale(ticks[0], ticks[ticks.length - 1], height - PAD.bottom, PAD.top);

  const path = (pts: TrendPoint[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');

  const bestIndex = points.reduce((b, p, i) => (p.y >= points[b].y ? i : b), 0);
  const shown = selected ?? points.length - 1;
  const lastProjection = projection[projection.length - 1];

  const selectNearest = (px: number) => {
    let nearest = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.x) - px) < Math.abs(x(points[nearest].x) - px)) nearest = i;
    });
    setSelected(nearest);
  };

  return (
    <View>
      {/* Readout: latest point by default, the touched point while scrubbing */}
      <View className="flex-row justify-between items-end mb-2 min-h-[34px]">
        <View>
          <Text className="text-primary text-lg font-mono-bold tracking-tight">{formatValue(points[shown].y)}</Text>
          <Text className="text-muted text-[10px] tracking-wider">
            {formatX(points[shown].x)}{describe ? ` · ${describe(shown)}` : ''}
          </Text>
        </View>
        {lastProjection && selected == null && (
          <View className="items-end">
            <Text className="text-muted text-sm font-mono-bold">{formatValue(lastProjection.y)}</Text>
            <Text className="text-muted text-[10px] tracking-wider">PROJECTED {formatX(lastProjection.x)}</Text>
          </View>
        )}
      </View>

      <View onLayout={onLayout} style={{ height }} {...scrubHandlers(selectNearest, () => setSelected(null))}>
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
            <SvgText x={PAD.left} y={height - 6} fontSize={9} fill={c.muted} fontFamily={CHART_FONT}>
              {formatX(points[0].x)}
            </SvgText>
            <SvgText x={width - PAD.right} y={height - 6} fontSize={9} fill={c.muted} textAnchor="end" fontFamily={CHART_FONT}>
              {formatX((lastProjection ?? points[points.length - 1]).x)}
            </SvgText>

            {projection.length > 1 && (
              <Path d={path(projection)} stroke={c.accentText} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="4 4" fill="none" />
            )}
            {points.length > 1 && (
              <Path d={path(points)} stroke={c.accentText} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            )}

            {selected != null && (
              <Line x1={x(points[selected].x)} x2={x(points[selected].x)} y1={PAD.top} y2={height - PAD.bottom} stroke={c.muted} strokeWidth={1} />
            )}
            {/* Dots only when they stay readable */}
            {points.length <= 40 && points.map((p, i) => (
              <Circle key={i} cx={x(p.x)} cy={y(p.y)} r={3} fill={c.accentText} stroke={c.surface} strokeWidth={2} />
            ))}
            {markBest && points.length > 1 && (
              <Circle cx={x(points[bestIndex].x)} cy={y(points[bestIndex].y)} r={6} fill="none" stroke={c.primary} strokeWidth={1.5} />
            )}
            <Circle cx={x(points[shown].x)} cy={y(points[shown].y)} r={5} fill={c.accentText} stroke={c.surface} strokeWidth={2} />
          </Svg>
        )}
      </View>
    </View>
  );
}
