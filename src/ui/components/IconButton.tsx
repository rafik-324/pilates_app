import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '../icons/Icon';
import { useTheme } from '../theme';

type Props = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'plain' | 'filled' | 'primary';
  size?: 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
};

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'plain',
  size = 'md',
  disabled,
  style,
}: Props) {
  const { colors, touchMin, borderWidth, space } = useTheme();
  const dim = size === 'lg' ? touchMin + space.xl : touchMin;
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'filled'
        ? colors.surfaceRaised
        : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: dim,
          height: dim,
          borderRadius: dim,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          borderWidth: variant === 'filled' ? borderWidth : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon
        name={icon}
        size={size === 'lg' ? 32 : 24}
        tone={variant === 'primary' ? 'onAccent' : 'text'}
      />
    </Pressable>
  );
}
