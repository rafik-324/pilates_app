import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../icons/Icon';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
};

export function SelectCard({ title, subtitle, selected, onPress, multi }: Props) {
  const { colors, radius, space, touchMin, borderWidth } = useTheme();
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        minHeight: touchMin + space.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        padding: space.lg,
        borderRadius: radius.lg,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? borderWidth * 2 : borderWidth,
        borderColor: selected ? colors.accent : colors.border,
      }}
    >
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <View
          style={{
            width: space.xl,
            height: space.xl,
            borderRadius: radius.full,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={16} tone="onAccent" />
        </View>
      ) : null}
    </Pressable>
  );
}
