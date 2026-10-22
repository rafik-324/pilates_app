import React, { useMemo } from 'react';
import { View } from 'react-native';
import { getContent, getWorkoutThumbnail } from '@/data/content/loader';
import { CATEGORIES, localized, type Category } from '@/domain/content';
import { useLang, useTranslation } from '@/i18n';
import { Icon, ListItem, Screen, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const { space } = useTheme();
  const { workouts } = getContent();

  const grouped = useMemo(
    () =>
      CATEGORIES.map((c: Category) => ({
        category: c,
        items: workouts.filter((w) => w.kategorie === c),
      })).filter((g) => g.items.length > 0),
    [workouts],
  );

  return (
    <Screen scroll>
      <View style={{ gap: space.xs }}>
        <Text variant="title1">{t('discover.title')}</Text>
        <Text tone="muted">{t('discover.workouts', { count: workouts.length })}</Text>
      </View>
      {grouped.map((g) => (
        <View key={g.category}>
          <Text variant="title3">{t(`categories.${g.category}`)}</Text>
          {g.items.map((w) => (
            <ListItem
              key={w.id}
              title={localized(w.titel, lang)}
              subtitle={`${t('common.min', { count: w.geschaetzte_dauer })} · ${t(`levels.${w.level}`)}`}
              thumbnail={getWorkoutThumbnail(w)}
              right={w.premium ? <Icon name="lock" size={18} tone="muted" /> : undefined}
              showChevron={false}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
