import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';

type Props = { progress: number; height?: number };

export function ProgressBar({ progress, height }: Props) {
  const { colors, radius, space } = useTheme();
  const h = height ?? space.xs + 2;
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{
        height: h,
        borderRadius: radius.full,
        backgroundColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={[...colors.accentGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${pct}%`, height: h, borderRadius: radius.full }}
      />
    </View>
  );
}
