import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = { value: string; label: string; large?: boolean };

export function StatTile({ value, label, large }: Props) {
  const { space } = useTheme();
  return (
    <View style={{ flex: 1, gap: space.xs }} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant={large ? 'display' : 'title2'}>{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}
