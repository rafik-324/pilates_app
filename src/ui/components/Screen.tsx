import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  /** Kanten, die Safe Area berücksichtigen. Standard: oben (Tabs liefern unten selbst). */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  padded?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, scroll, edges = ['top'], padded = true, style }: Props) {
  const { colors, space } = useTheme();
  const pad = padded ? { paddingHorizontal: space.screen } : null;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            pad,
            { paddingTop: space.lg, paddingBottom: space.xxl, gap: space.lg },
            style,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
