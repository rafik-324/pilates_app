import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Image, View } from 'react-native';
import { getExercise, getMedia } from '@/data/content/loader';
import { localized } from '@/domain/content';
import { workoutStats } from '@/domain/workoutStats';
import { useLang, useTranslation } from '@/i18n';
import { usePlan } from '@/features/plan/store';
import { useProfile } from '@/state/profile';
import { Button, Icon, IconButton, ListItem, Screen, StatTile, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { refFromParams, resolveWorkout } from './resolve';

/** Workout-Detailseite (/F330/): Kennzahlen und Übungsliste. */
export function WorkoutDetailScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const { space, radius, colors } = useTheme();
  const params = useLocalSearchParams();
  const profile = useProfile((s) => s.profile);
  const { personal, challenge, refresh } = usePlan();

  useEffect(() => {
    if (!personal) refresh();
  }, [personal, refresh]);

  const ref = refFromParams(params);
  const workout = useMemo(
    () => (ref ? resolveWorkout(ref, [personal, challenge]) : null),
    [ref, personal, challenge],
  );

  if (!workout) {
    return (
      <Screen>
        <IconButton icon="chevronLeft" label={t('workout.back')} onPress={() => router.back()} />
        <Text tone="muted">{t('workout.notFound')}</Text>
      </Screen>
    );
  }

  const weight = profile?.einwilligungGesundheitsdaten ? profile.gewichtKg : null;
  const stats = workoutStats(workout.entries, workout.pauseS, getExercise, weight);
  const title = workout.title
    ? localized(workout.title, lang)
    : t('plan.day', { n: workout.tagNr });
  const first = workout.entries[0] ? getMedia(workout.entries[0].uebung_id) : undefined;

  return (
    <Screen scroll>
      <IconButton icon="chevronLeft" label={t('workout.back')} onPress={() => router.back()} />
      {first ? (
        <Image
          source={first.thumbnail}
          style={{
            width: '100%',
            aspectRatio: 1,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
          }}
        />
      ) : null}
      <View style={{ gap: space.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text variant="title1" style={{ flexShrink: 1 }}>
            {title}
          </Text>
          {workout.premium ? <Icon name="lock" size={18} tone="muted" /> : null}
        </View>
        {workout.level ? <Text tone="muted">{t(`levels.${workout.level}`)}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: space.lg }}>
        <StatTile value={String(stats.minutes)} label={t('workout.duration')} />
        <StatTile value={String(stats.exerciseCount)} label={t('workout.exercises')} />
        <StatTile value={(stats.kcalEstimated ? '~' : '') + stats.kcal} label={t('workout.kcal')} />
      </View>
      {stats.kcalEstimated ? (
        <Text variant="caption" tone="muted">
          {t('workout.kcalEstimateHint')}
        </Text>
      ) : null}
      <View>
        <Text variant="title3">{t('workout.exerciseList')}</Text>
        {workout.entries.map((e, i) => {
          const ex = getExercise(e.uebung_id);
          if (!ex) return null;
          return (
            <ListItem
              key={`${e.uebung_id}-${i}`}
              title={localized(ex.name, lang)}
              subtitle={
                e.dauer_s !== undefined
                  ? t('workout.seconds', { count: e.dauer_s })
                  : t('workout.reps', { count: e.wdh })
              }
              thumbnail={getMedia(ex.id)?.thumbnail}
              showChevron={false}
            />
          );
        })}
      </View>
      <Button
        title={t('common.back')}
        variant="secondary"
        fullWidth
        onPress={() => router.back()}
      />
    </Screen>
  );
}
