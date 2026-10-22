import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
};

export function Dialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
  children,
}: Props) {
  const { colors, radius, space } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          padding: space.screen,
        }}
      >
        <Pressable
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.background,
            borderRadius: radius.lg,
            padding: space.xl,
            gap: space.lg,
          }}
        >
          <Text variant="title2">{title}</Text>
          {message ? <Text tone="muted">{message}</Text> : null}
          {children}
          <View style={{ gap: space.sm }}>
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              fullWidth
              onPress={onConfirm}
            />
            {cancelLabel ? (
              <Button title={cancelLabel} variant="ghost" fullWidth onPress={onCancel} />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
