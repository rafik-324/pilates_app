import React from 'react';
import { useTranslation } from '@/i18n';
import { Screen, Text } from '@/ui/components';

export default function ProgressScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <Text variant="title1">{t('tabs.progress')}</Text>
      <Text tone="muted">{t('placeholder.progress')}</Text>
    </Screen>
  );
}
