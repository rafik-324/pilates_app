import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useTheme, type TypographyVariant } from '../theme';

export type TextTone =
  'text' | 'muted' | 'accent' | 'success' | 'danger' | 'onAccent' | 'onInverse';

type Props = TextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', tone = 'text', align, style, ...rest }: Props) {
  const { typography, colors } = useTheme();
  const t = typography[variant];
  const color = {
    text: colors.text,
    muted: colors.textMuted,
    accent: colors.accentText,
    success: colors.successText,
    danger: colors.dangerText,
    onAccent: colors.onAccent,
    onInverse: colors.onInverse,
  }[tone];
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale}
      {...rest}
      style={[
        {
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          color,
          textAlign: align,
          fontVariant: t.tabularNums ? ['tabular-nums'] : undefined,
        },
        style,
      ]}
    />
  );
}
