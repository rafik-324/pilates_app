import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  ListItem,
  ProgressBar,
  ProgressRing,
  Screen,
  SelectCard,
  StatTile,
  Text,
} from '@/ui/components';
import { ThemeProvider, useTheme, type ColorScheme } from '@/ui/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <Text variant="caption" tone="muted">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Preview() {
  const { t } = useTranslation();
  const { space, scheme } = useTheme();
  const [selected, setSelected] = useState(0);
  const [chip, setChip] = useState(0);
  const [dialog, setDialog] = useState(false);

  return (
    <Screen edges={[]} scroll style={{ paddingTop: space.lg }}>
      <Text variant="title1">{scheme === 'dark' ? 'Dark' : 'Light'}</Text>

      <Section title={t('themePreview.typography')}>
        <Text variant="timer">00:30</Text>
        <Text variant="display">Display</Text>
        <Text variant="title1">Title 1</Text>
        <Text variant="title2">Title 2</Text>
        <Text variant="title3">Title 3</Text>
        <Text variant="body">Body</Text>
        <Text variant="bodyStrong">Body strong</Text>
        <Text variant="caption" tone="muted">
          Caption
        </Text>
        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <Text tone="accent">accent</Text>
          <Text tone="success">success</Text>
          <Text tone="danger">danger</Text>
        </View>
      </Section>

      <Section title={t('themePreview.buttons')}>
        <Button title={t('themePreview.primary')} fullWidth size="lg" />
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <Button title={t('themePreview.secondary')} variant="secondary" />
          <Button title={t('themePreview.ghost')} variant="ghost" />
          <Button title={t('themePreview.success')} variant="success" />
          <Button title={t('themePreview.danger')} variant="danger" />
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <IconButton icon="previous" label="previous" variant="filled" />
          <IconButton icon="pause" label="pause" variant="primary" size="lg" />
          <IconButton icon="next" label="next" variant="filled" />
        </View>
      </Section>

      <Section title={t('themePreview.cards')}>
        <Card variant="inverse">
          <Text variant="title2" tone="onInverse">
            {t('themePreview.dayCard')}
          </Text>
          <Text tone="onInverse">{t('themePreview.dayCardMeta')}</Text>
        </Card>
        <SelectCard
          title={t('themePreview.selectA')}
          selected={selected === 0}
          onPress={() => setSelected(0)}
        />
        <SelectCard
          title={t('themePreview.selectB')}
          subtitle="Subtitle"
          selected={selected === 1}
          onPress={() => setSelected(1)}
        />
      </Section>

      <Section title={t('themePreview.chips')}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {['Wall Pilates', 'Bauch', 'Rücken'].map((c, i) => (
            <Chip key={c} label={c} selected={chip === i} onPress={() => setChip(i)} />
          ))}
        </View>
      </Section>

      <Section title={t('themePreview.progress')}>
        <ProgressBar progress={0.6} />
        <ProgressRing progress={0.6} size={96}>
          <Text variant="title3">60%</Text>
        </ProgressRing>
      </Section>

      <Section title={t('themePreview.stats')}>
        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <StatTile value="18" label="Min." />
          <StatTile value="9" label="Übungen" />
          <StatTile value="64" label="kcal" />
        </View>
      </Section>

      <Section title={t('themePreview.lists')}>
        <ListItem title="Schulterbrücke" subtitle="Po, Beine · 30 s" onPress={() => {}} />
        <ListItem title="Alle Daten löschen" tone="danger" leftIcon="trash" onPress={() => {}} />
      </Section>

      <Section title={t('themePreview.dialog')}>
        <Button
          title={t('themePreview.openDialog')}
          variant="secondary"
          onPress={() => setDialog(true)}
        />
        <Dialog
          visible={dialog}
          title={t('themePreview.dialogTitle')}
          message={t('themePreview.dialogMessage')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={() => setDialog(false)}
          onCancel={() => setDialog(false)}
        />
      </Section>
    </Screen>
  );
}

function Pane({ scheme }: { scheme: ColorScheme }) {
  return (
    <ThemeProvider forceScheme={scheme}>
      <PaneInner />
    </ThemeProvider>
  );
}

function PaneInner() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Preview />
    </View>
  );
}

export default function ThemePreviewScreen() {
  const { t } = useTranslation();
  const [scheme, setScheme] = useState<ColorScheme>('light');
  const { space, colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: true, title: t('themePreview.title') }} />
      <View style={{ flexDirection: 'row', gap: space.sm, padding: space.lg }}>
        <Chip label="Light" selected={scheme === 'light'} onPress={() => setScheme('light')} />
        <Chip label="Dark" selected={scheme === 'dark'} onPress={() => setScheme('dark')} />
      </View>
      <Pane scheme={scheme} />
    </View>
  );
}
