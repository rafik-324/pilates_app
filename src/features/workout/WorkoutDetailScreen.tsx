import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { getExercise, getMedia } from '@/data/content/loader';
import { localized, type WorkoutEntry } from '@/domain/content';
import { stepEntry } from '@/domain/library';
import { workoutStats } from '@/domain/workoutStats';
import { ensureLibraryLoaded, useLibrary } from '@/features/library/store';
import { usePlan } from '@/features/plan/store';
import { useLang, useTranslation } from '@/i18n';
import { useProfile } from '@/state/profile';
import { Button, Icon, IconButton, ListItem, Screen, StatTile, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { startWorkout } from './launch';
import { refFromParams, resolveWorkout } from './resolve';

/** Workout-Detailseite (/F330/) mit Anpassung vor dem Start (/F440/). */
export function WorkoutDetailScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const { space, radius, colors } = useTheme();
  const params = useLocalSearchParams();
  const profile = useProfile((s) => s.profile);
  const { personal, challenge, refresh } = usePlan();
  const favorites = useLibrary((s) => s.favoriteWorkouts);
  const premiumFree = useLibrary((s) => s.premiumFree);
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);
  const [editing, setEditing] = useState(false);
  const [entries, setEntries] = useState<WorkoutEntry[] | null>(null);

  useEffect(() => {
    ensureLibraryLoaded();
    if (!personal) refresh();
  }, [personal, refresh]);

  const paramKey = JSON.stringify(params);
  const ref = useMemo(() => refFromParams(JSON.parse(paramKey)), [paramKey]);
  const workout = useMemo(
    () => (ref ? resolveWorkout(ref, [personal, challenge]) : null),
    [ref, personal, challenge],
  );

  if (!workout || !ref) {
    return (
      <Screen>
        <IconButton icon="chevronLeft" label={t('workout.back')} onPress={() => router.back()} />
        <Text tone="muted">{t('workout.notFound')}</Text>
      </Screen>
    );
  }

  const list = entries ?? workout.entries;
  const weight = profile?.einwilligungGesundheitsdaten ? profile.gewichtKg : null;
  const stats = workoutStats(list, workout.pauseS, getExercise, weight);
  const title = workout.title
    ? localized(workout.title, lang)
    : t('plan.day', { n: workout.tagNr });
  const first = list[0] ? getMedia(list[0].uebung_id) : undefined;
  const isFavorite = ref.kind === 'library' && favorites.has(ref.id);
  const locked = workout.premium && !premiumFree;

  const step = (index: number, dir: 1 | -1) =>
    setEntries(list.map((e, i) => (i === index ? stepEntry(e, dir) : e)));

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <IconButton icon="chevronLeft" label={t('workout.back')} onPress={() => router.back()} />
        {ref.kind === 'library' ? (
          <IconButton
            icon="heart"
            variant={isFavorite ? 'filled' : 'plain'}
            label={isFavorite ? t('exercise.unfavorite') : t('exercise.favorite')}
            onPress={() => toggleFavorite('workout', ref.id)}
          />
        ) : null}
      </View>
      {first ? (
        <Image
          source={first.thumbnail}
          style={{
            width: '100%',
            aspectRatio: 1.6,
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
          {workout.premium ? (
            <View accessible accessibilityLabel={t('discover.premium')}>
              <Icon name="lock" size={18} tone="muted" />
            </View>
          ) : null}
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

      {locked ? (
        <Text tone="muted">{t('workout.premiumLocked')}</Text>
      ) : (
        <Button
          title={t('workout.start')}
          size="lg"
          fullWidth
          onPress={() => startWorkout({ ...workout, entries: list })}
        />
      )}

      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="title3" style={{ flex: 1 }}>
            {t('workout.exerciseList')}
          </Text>
          <Button
            title={editing ? t('workout.adjustDone') : t('workout.adjust')}
            variant="ghost"
            onPress={() => setEditing(!editing)}
          />
        </View>
        {editing ? (
          <Text variant="caption" tone="muted">
            {t('workout.adjustHint')}
          </Text>
        ) : null}
        {list.map((e, i) => {
          const ex = getExercise(e.uebung_id);
          if (!ex) return null;
          const amount =
            e.dauer_s !== undefined
              ? t('workout.seconds', { count: e.dauer_s })
              : t('workout.reps', { count: e.wdh });
          const name = localized(ex.name, lang);
          return (
            <ListItem
              key={`${e.uebung_id}-${i}`}
              title={name}
              subtitle={amount}
              thumbnail={getMedia(ex.id)?.thumbnail}
              onPress={
                editing
                  ? undefined
                  : () => router.push({ pathname: '/exercise', params: { id: ex.id } })
              }
              right={
                editing ? (
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton
                      icon="minus"
                      label={t('workout.less', { name })}
                      onPress={() => step(i, -1)}
                    />
                    <IconButton
                      icon="plus"
                      label={t('workout.more', { name })}
                      onPress={() => step(i, 1)}
                    />
                  </View>
                ) : undefined
              }
            />
          );
        })}
      </View>
    </Screen>
  );
}
