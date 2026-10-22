import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  values: number[];
  /** Beschriftung links unten / rechts unten (z. B. erstes und letztes Datum) */
  startLabel?: string;
  endLabel?: string;
  height?: number;
  accessibilityLabel: string;
};

/** Liniendiagramm (Gewichtsverlauf /F840/): Linie in `text`, letzter Wert in Akzentfarbe. */
export function LineChart({
  values,
  startLabel,
  endLabel,
  height = 140,
  accessibilityLabel,
}: Props) {
  const { colors, space } = useTheme();
  const [width, setWidth] = useState(0);
  const pad = space.sm;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) =>
    values.length === 1 ? width / 2 : pad + (i / (values.length - 1)) * (width - 2 * pad);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - 2 * pad);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const last = values.length - 1;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: space.xs }}
    >
      {width > 0 && values.length > 0 ? (
        <Svg width={width} height={height}>
          <Line x1={0} x2={width} y1={height - 1} y2={height - 1} stroke={colors.border} />
          {values.length > 1 ? (
            <Polyline points={points} fill="none" stroke={colors.text} strokeWidth={2} />
          ) : null}
          {values.map((v, i) => (
            <Circle
              key={i}
              cx={x(i)}
              cy={y(v)}
              r={i === last ? 5 : 3}
              fill={i === last ? colors.accentText : colors.text}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      {startLabel || endLabel ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" tone="muted">
            {startLabel ?? ''}
          </Text>
          <Text variant="caption" tone="muted">
            {endLabel ?? ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
