import React from 'react';
import { useTranslation } from '@/i18n';
import { Screen, Text } from '@/ui/components';

export default function PlanScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <Text variant="title1">{t('tabs.plan')}</Text>
      <Text tone="muted">{t('placeholder.plan')}</Text>
    </Screen>
  );
}
