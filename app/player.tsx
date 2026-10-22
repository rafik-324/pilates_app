import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from '@/i18n';
import { Button, Screen, Text } from '@/ui/components';

// Platzhalter bis Phase 6 (Workout-Player)
export default function PlayerPlaceholder() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="title2">{t('workout.playerSoon')}</Text>
      <Button title={t('common.back')} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
