import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = { label: string; selected?: boolean; onPress?: () => void };

export function Chip({ label, selected, onPress }: Props) {
  const { colors, radius, space, borderWidth, touchMin } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: touchMin - space.sm,
        justifyContent: 'center',
        paddingHorizontal: space.lg,
        borderRadius: radius.full,
        backgroundColor: selected ? colors.inverse : 'transparent',
        borderWidth: borderWidth,
        borderColor: selected ? colors.inverse : colors.border,
      }}
    >
      <Text variant="caption" tone={selected ? 'onInverse' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}
