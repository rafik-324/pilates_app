import React from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  suffix?: string;
  maxLength?: number;
  error?: string | null;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  suffix,
  maxLength,
  error,
}: Props) {
  const { colors, typography, radius, space, touchMin, borderWidth } = useTheme();
  const t = typography.body;
  return (
    <View style={{ gap: space.xs, flex: 1 }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: touchMin + space.sm,
          paddingHorizontal: space.lg,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: borderWidth,
          borderColor: error ? colors.danger : colors.border,
          gap: space.sm,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType={keyboardType}
          maxLength={maxLength}
          style={{
            flex: 1,
            color: colors.text,
            fontFamily: t.fontFamily,
            fontSize: t.fontSize,
            paddingVertical: space.md,
          }}
        />
        {suffix ? (
          <Text tone="muted" variant="body">
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
