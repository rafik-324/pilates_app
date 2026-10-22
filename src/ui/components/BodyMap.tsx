import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useTheme } from '../theme';

export type BodyZone = 'bauch' | 'arme' | 'brust' | 'po' | 'beine' | 'ganzkoerper' | 'ruecken';

type Props = { zones: readonly BodyZone[]; size?: number; accessibilityLabel: string };

type Shape = { x: number; y: number; w: number; h: number };

/** Vereinfachte Körpergrafik (/F420/): Vorder- und Rückseite, Fokusbereiche in `accent`. */
const FRONT: Record<string, Shape[]> = {
  brust: [{ x: 34, y: 34, w: 32, h: 14 }],
  bauch: [{ x: 36, y: 50, w: 28, h: 20 }],
  arme: [
    { x: 20, y: 34, w: 10, h: 38 },
    { x: 70, y: 34, w: 10, h: 38 },
  ],
  beine: [
    { x: 36, y: 86, w: 12, h: 52 },
    { x: 52, y: 86, w: 12, h: 52 },
  ],
};
const BACK: Record<string, Shape[]> = {
  ruecken: [{ x: 34, y: 34, w: 32, h: 34 }],
  po: [{ x: 36, y: 70, w: 28, h: 16 }],
  arme: FRONT.arme,
  beine: FRONT.beine,
};
const BASE: Shape[] = [
  { x: 32, y: 32, w: 36, h: 54 },
  { x: 20, y: 34, w: 10, h: 38 },
  { x: 70, y: 34, w: 10, h: 38 },
  { x: 36, y: 86, w: 12, h: 52 },
  { x: 52, y: 86, w: 12, h: 52 },
];

export function BodyMap({ zones, size = 140, accessibilityLabel }: Props) {
  const { colors, radius, space } = useTheme();
  const all = zones.includes('ganzkoerper');

  const figure = (map: Record<string, Shape[]>) => (
    <Svg width={size * 0.7} height={size} viewBox="0 0 100 145">
      <Circle cx={50} cy={18} r={11} fill={all ? colors.accent : colors.surfaceRaised} />
      {BASE.map((s, i) => (
        <Rect
          key={`b${i}`}
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={4}
          fill={all ? colors.accent : colors.surfaceRaised}
          stroke={colors.border}
        />
      ))}
      {Object.entries(map)
        .filter(([zone]) => zones.includes(zone as BodyZone))
        .flatMap(([zone, shapes]) =>
          shapes.map((s, i) => (
            <Rect
              key={`${zone}${i}`}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={4}
              fill={colors.accent}
            />
          )),
        )}
    </Svg>
  );

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: space.xl,
        padding: space.md,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
      }}
    >
      {figure(FRONT)}
      {figure(BACK)}
    </View>
  );
}
