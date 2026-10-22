import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { getRepositories } from '@/data/init';
import { useTranslation } from '@/i18n';
import { Button, Icon, Screen, StatTile, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { formatClock } from './PlayerScreen';

/** Abschlussbildschirm (/F700/, /F710/). */
export function CompleteScreen() {
  const { t } = useTranslation();
  const { space, colors, radius } = useTheme();
  const { session } = useLocalSearchParams<{ session?: string }>();
  const record = useMemo(
    () => (session ? getRepositories().sessions.get(Number(session)) : null),
    [session],
  );

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ alignItems: 'center', gap: space.md, paddingTop: space.xl }}>
        <View
          style={{
            width: space.huge + space.xl,
            height: space.huge + space.xl,
            borderRadius: radius.full,
            backgroundColor: colors.success,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={48} color={colors.onSuccess} />
        </View>
        <Text variant="title1" align="center">
          {t('complete.title')}
        </Text>
      </View>
      {record ? (
        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <StatTile large value={formatClock(record.dauerS)} label={t('complete.duration')} />
          <StatTile large value={String(record.uebungenErledigt)} label={t('complete.exercises')} />
          <StatTile
            large
            value={(record.kcalGeschaetzt ? '~' : '') + Math.round(record.kcal)}
            label={t('complete.kcal')}
          />
        </View>
      ) : null}
      <Button title={t('complete.done')} size="lg" fullWidth onPress={() => router.replace('/')} />
    </Screen>
  );
}
