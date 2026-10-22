import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { stepProgress } from '@/domain/onboarding';
import { useTranslation } from '@/i18n';
import { Button, IconButton, ProgressBar, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { useOnboarding } from './store';

type Action = { label: string; onPress: () => void; disabled?: boolean };

type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  primary?: Action;
  secondary?: Action;
  showBack?: boolean;
};

/** Gemeinsamer Rahmen: Fortschrittsbalken oben, eine Frage pro Bildschirm, Primäraktion unten. */
export function StepLayout({
  title,
  subtitle,
  children,
  primary,
  secondary,
  showBack = true,
}: Props) {
  const { t } = useTranslation();
  const { colors, space } = useTheme();
  const step = useOnboarding((s) => s.step);
  const canGoBack = useOnboarding((s) => s.history.length > 0);
  const back = useOnboarding((s) => s.back);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            paddingHorizontal: space.screen,
            paddingTop: space.sm,
          }}
        >
          {showBack && canGoBack ? (
            <IconButton icon="chevronLeft" label={t('onboarding.backLabel')} onPress={back} />
          ) : (
            <View style={{ width: space.sm }} />
          )}
          <View style={{ flex: 1 }}>
            <ProgressBar progress={stepProgress(step)} />
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: space.screen, gap: space.lg, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: space.sm }}>
            <Text variant="title1" accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
          </View>
          <View style={{ gap: space.md }}>{children}</View>
        </ScrollView>
        <View style={{ padding: space.screen, gap: space.sm }}>
          {primary ? (
            <Button
              title={primary.label}
              size="lg"
              fullWidth
              onPress={primary.onPress}
              disabled={primary.disabled}
            />
          ) : null}
          {secondary ? (
            <Button
              title={secondary.label}
              variant="ghost"
              fullWidth
              onPress={secondary.onPress}
              disabled={secondary.disabled}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
