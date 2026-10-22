import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { getContent, getExercise, getMedia, getWorkoutThumbnail } from '@/data/content/loader';
import { CATEGORIES, localized, ZONES, type Exercise, type Workout } from '@/domain/content';
import {
  filterExercises,
  filterWorkouts,
  isFilterActive,
  normalize,
  searchExercises,
  searchWorkouts,
  type DurationBucket,
  type LibraryFilter,
} from '@/domain/library';
import { refToParams } from '@/features/workout/resolve';
import { useLang, useTranslation } from '@/i18n';
import { Button, Chip, Icon, ListItem, Screen, Text, TextField } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { ensureLibraryLoaded, useLibrary } from './store';

const DURATIONS: DurationBucket[] = ['kurz', 'mittel', 'lang'];

function toggle<T>(current: T | null | undefined, value: T): T | null {
  return current === value ? null : value;
}

/** Entdecken-Tab (/F300/ bis /F360/): Suche, Filter, Kategorien. */
export function DiscoverScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const { space } = useTheme();
  const { workouts, exercises } = getContent();
  const favoriteWorkouts = useLibrary((s) => s.favoriteWorkouts);
  const favoriteExercises = useLibrary((s) => s.favoriteExercises);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>({});

  useEffect(() => {
    ensureLibraryLoaded();
  }, []);

  const searching = normalize(query).length > 0 || isFilterActive(filter);

  const results = useMemo(() => {
    if (!searching) return null;
    const ws = filterWorkouts(
      searchWorkouts(workouts, query, getExercise),
      filter,
      getExercise,
      favoriteWorkouts,
    );
    const base = normalize(query) ? searchExercises(exercises, query) : exercises;
    let es = filterExercises(base, filter);
    if (filter.favoritesOnly) es = es.filter((e) => favoriteExercises.has(e.id));
    if (filter.duration && !normalize(query)) es = [];
    return { workouts: ws, exercises: es };
  }, [searching, workouts, exercises, query, filter, favoriteWorkouts, favoriteExercises]);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        category: c,
        items: workouts.filter((w) => w.kategorie === c),
      })).filter((g) => g.items.length > 0),
    [workouts],
  );

  const openWorkout = (w: Workout) =>
    router.push({ pathname: '/workout', params: refToParams({ kind: 'library', id: w.id }) });
  const openExercise = (e: Exercise) =>
    router.push({ pathname: '/exercise', params: { id: e.id } });

  const workoutItem = (w: Workout) => (
    <ListItem
      key={w.id}
      title={localized(w.titel, lang)}
      subtitle={`${t('common.min', { count: w.geschaetzte_dauer })} · ${t(`levels.${w.level}`)}`}
      thumbnail={getWorkoutThumbnail(w)}
      right={
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {favoriteWorkouts.has(w.id) ? <Icon name="heart" size={18} tone="muted" /> : null}
          {w.premium ? (
            <View accessible accessibilityLabel={t('discover.premium')}>
              <Icon name="lock" size={18} tone="muted" />
            </View>
          ) : null}
        </View>
      }
      onPress={() => openWorkout(w)}
    />
  );

  const chipRow = (children: React.ReactNode) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.sm }}
    >
      {children}
    </ScrollView>
  );

  return (
    <Screen scroll>
      <Text variant="title1">{t('discover.title')}</Text>
      <TextField
        label={t('discover.search')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('discover.searchPlaceholder')}
      />

      <View style={{ gap: space.sm }}>
        {chipRow(
          <>
            <Chip
              label={t('discover.favorites')}
              selected={!!filter.favoritesOnly}
              onPress={() => setFilter({ ...filter, favoritesOnly: !filter.favoritesOnly })}
            />
            <Chip
              label={t('discover.withoutFloor')}
              selected={filter.boden === false}
              onPress={() => setFilter({ ...filter, boden: toggle(filter.boden, false) })}
            />
            <Chip
              label={t('discover.withFloor')}
              selected={filter.boden === true}
              onPress={() => setFilter({ ...filter, boden: toggle(filter.boden, true) })}
            />
            <Chip
              label={t('discover.withWall')}
              selected={filter.wand === true}
              onPress={() => setFilter({ ...filter, wand: toggle(filter.wand, true) })}
            />
            <Chip
              label={t('discover.withoutWall')}
              selected={filter.wand === false}
              onPress={() => setFilter({ ...filter, wand: toggle(filter.wand, false) })}
            />
          </>,
        )}
        {chipRow(
          <>
            {([1, 2, 3] as const).map((l) => (
              <Chip
                key={l}
                label={t(`levels.${l}`)}
                selected={filter.level === l}
                onPress={() => setFilter({ ...filter, level: toggle(filter.level, l) })}
              />
            ))}
            {DURATIONS.map((d) => (
              <Chip
                key={d}
                label={t(`discover.duration_${d}`)}
                selected={filter.duration === d}
                onPress={() => setFilter({ ...filter, duration: toggle(filter.duration, d) })}
              />
            ))}
          </>,
        )}
        {chipRow(
          ZONES.map((z) => (
            <Chip
              key={z}
              label={t(`zones.${z}`)}
              selected={filter.zone === z}
              onPress={() => setFilter({ ...filter, zone: toggle(filter.zone, z) })}
            />
          )),
        )}
        {searching ? (
          <Button
            title={t('discover.reset')}
            variant="ghost"
            onPress={() => {
              setQuery('');
              setFilter({});
            }}
          />
        ) : null}
      </View>

      {results ? (
        <>
          <View>
            <Text variant="title3">
              {t('discover.resultWorkouts', { count: results.workouts.length })}
            </Text>
            {results.workouts.map(workoutItem)}
          </View>
          {results.exercises.length > 0 ? (
            <View>
              <Text variant="title3">
                {t('discover.resultExercises', { count: results.exercises.length })}
              </Text>
              {results.exercises.map((e) => (
                <ListItem
                  key={e.id}
                  title={localized(e.name, lang)}
                  subtitle={t(`levels.${e.level}`)}
                  thumbnail={getMedia(e.id)?.thumbnail}
                  onPress={() => openExercise(e)}
                />
              ))}
            </View>
          ) : null}
          {results.workouts.length === 0 && results.exercises.length === 0 ? (
            <Text tone="muted">{t('discover.noResults')}</Text>
          ) : null}
        </>
      ) : (
        <>
          <Text tone="muted">{t('discover.workouts', { count: workouts.length })}</Text>
          {grouped.map((g) => (
            <View key={g.category}>
              <Text variant="title3">{t(`categories.${g.category}`)}</Text>
              {g.items.map(workoutItem)}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
