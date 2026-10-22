import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  variant?: 'default' | 'inverse';
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function Card({ children, variant = 'default', onPress, style, accessibilityLabel }: Props) {
  const { colors, radius, space, borderWidth } = useTheme();
  const base: ViewStyle = {
    backgroundColor: variant === 'inverse' ? colors.inverse : colors.surface,
    borderRadius: radius.lg,
    borderWidth: variant === 'inverse' ? 0 : borderWidth,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  };
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.8 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
