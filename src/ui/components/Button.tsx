import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text, type TextTone } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  accessibilityLabel,
  style,
}: Props) {
  const { colors, radius, space, touchMin, borderWidth } = useTheme();
  const height = size === 'lg' ? touchMin + space.sm : touchMin;
  const isPrimary = variant === 'primary';

  const bg: Record<ButtonVariant, string> = {
    primary: colors.accent,
    secondary: 'transparent',
    ghost: 'transparent',
    success: colors.success,
    danger: colors.danger,
  };
  const tone: Record<ButtonVariant, TextTone> = {
    primary: 'onAccent',
    secondary: 'text',
    ghost: 'accent',
    success: 'text',
    danger: 'onAccent',
  };

  const content = loading ? (
    <ActivityIndicator color={isPrimary || variant === 'danger' ? colors.onAccent : colors.text} />
  ) : (
    <Text
      variant="bodyStrong"
      tone={tone[variant]}
      style={variant === 'success' ? { color: colors.onSuccess } : undefined}
    >
      {title}
    </Text>
  );

  const glow =
    isPrimary && colors.accentGlow
      ? {
          shadowColor: colors.accentGlow,
          shadowOpacity: 0.35,
          shadowRadius: space.lg,
          shadowOffset: { width: 0, height: 0 },
          elevation: 0,
        }
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height,
          minWidth: touchMin,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderRadius: radius.full,
          backgroundColor: bg[variant],
          borderWidth: variant === 'secondary' ? borderWidth : 0,
          borderColor: colors.text,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          overflow: 'hidden',
        },
        glow,
        style,
      ]}
    >
      {isPrimary && (
        <LinearGradient
          colors={[...colors.accentGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: space.xl,
        }}
      >
        {content}
      </View>
    </Pressable>
  );
}
