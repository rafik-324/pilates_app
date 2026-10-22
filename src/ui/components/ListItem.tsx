import React from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';
import { Icon, type IconName } from '../icons/Icon';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  thumbnail?: ImageSourcePropType;
  leftIcon?: IconName;
  rightIcon?: IconName;
  showChevron?: boolean;
  tone?: 'default' | 'danger';
  onPress?: () => void;
  right?: React.ReactNode;
};

export function ListItem({
  title,
  subtitle,
  thumbnail,
  leftIcon,
  rightIcon,
  showChevron = true,
  tone = 'default',
  onPress,
  right,
}: Props) {
  const { colors, space, radius, touchMin, borderWidth } = useTheme();
  const thumb = touchMin + space.sm;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: touchMin + space.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: space.md,
        borderBottomWidth: borderWidth,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {thumbnail ? (
        <Image
          source={thumbnail}
          style={{
            width: thumb,
            height: thumb,
            borderRadius: radius.sm,
            backgroundColor: colors.surface,
          }}
        />
      ) : leftIcon ? (
        <Icon name={leftIcon} tone={tone === 'danger' ? 'danger' : 'muted'} />
      ) : null}
      <View style={{ flex: 1, gap: space.xs / 2 }}>
        <Text variant="bodyStrong" tone={tone === 'danger' ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {rightIcon ? <Icon name={rightIcon} tone="muted" size={18} /> : null}
      {onPress && showChevron && !rightIcon && !right ? (
        <Icon name="chevronRight" tone="muted" size={20} />
      ) : null}
    </Pressable>
  );
}
