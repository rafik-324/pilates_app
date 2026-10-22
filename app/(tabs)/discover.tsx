import React from 'react';
import { useTranslation } from '@/i18n';
import { Screen, Text } from '@/ui/components';

export default function DiscoverScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <Text variant="title1">{t('tabs.discover')}</Text>
      <Text tone="muted">{t('placeholder.discover')}</Text>
    </Screen>
  );
}
