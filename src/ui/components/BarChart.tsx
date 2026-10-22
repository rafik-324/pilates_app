import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  values: number[];
  labels: string[];
  /** Hervorgehobener Balken (z. B. heute) in `accentText` */
  highlightIndex?: number;
  height?: number;
  accessibilityLabel: string;
};

/** Balkendiagramm in Schwarz / Grau, aktueller Wert in Akzentfarbe (docs/DESIGN.md). */
export function BarChart({
  values,
  labels,
  highlightIndex,
  height = 140,
  accessibilityLabel,
}: Props) {
  const { colors, space, radius } = useTheme();
  const [width, setWidth] = useState(0);
  const max = Math.max(1, ...values);
  const slot = values.length ? width / values.length : 0;
  const barW = Math.max(4, slot * 0.5);
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: space.xs }}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Line x1={0} x2={width} y1={height - 1} y2={height - 1} stroke={colors.border} />
          {values.map((v, i) => {
            const h = v > 0 ? Math.max(3, (v / max) * (height - space.sm)) : 0;
            return (
              <Rect
                key={i}
                x={i * slot + (slot - barW) / 2}
                y={height - 1 - h}
                width={barW}
                height={h}
                rx={Math.min(radius.sm, barW / 2)}
                fill={i === highlightIndex ? colors.accentText : colors.textMuted}
              />
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <View style={{ flexDirection: 'row' }}>
        {labels.map((l, i) => (
          <Text
            key={i}
            variant="caption"
            tone={i === highlightIndex ? 'accent' : 'muted'}
            align="center"
            style={{ flex: 1 }}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}
