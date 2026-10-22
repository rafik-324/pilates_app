import React from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = { visible: boolean; title?: string; onClose: () => void; children: React.ReactNode };

export function Sheet({ visible, title, onClose, children }: Props) {
  const { colors, radius, space } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            maxHeight: '85%',
          }}
        >
          <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg }}>
            {title ? <Text variant="title2">{title}</Text> : null}
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
