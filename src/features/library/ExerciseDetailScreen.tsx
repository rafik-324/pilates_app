import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { getExercise, getMedia } from '@/data/content/loader';
import { localized, type Exercise } from '@/domain/content';
import { useLang, useTranslation } from '@/i18n';
import { BodyMap, Chip, IconButton, ListItem, LoopVideo, Screen, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { ensureLibraryLoaded, useLibrary } from './store';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="title3">{title}</Text>
      {children}
    </View>
  );
}

/** Übungsdetail (/F400/ bis /F430/): Video, Schritte, Atmung, Fehler, Fokus, Varianten. */
export function ExerciseDetailScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const { space } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const exercise = id ? getExercise(String(id)) : undefined;
  const favorite = useLibrary((s) => (exercise ? s.favoriteExercises.has(exercise.id) : false));
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);

  useEffect(() => {
    ensureLibraryLoaded();
  }, []);

  if (!exercise) {
    return (
      <Screen>
        <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => router.back()} />
        <Text tone="muted">{t('exercise.notFound')}</Text>
      </Screen>
    );
  }

  const media = getMedia(exercise.id);
  const name = localized(exercise.name, lang);
  const variants = [
    { label: t('exercise.easier'), ex: exercise.variante_leicht_id },
    { label: t('exercise.harder'), ex: exercise.variante_schwer_id },
  ]
    .map((v) => ({ label: v.label, ex: v.ex ? getExercise(v.ex) : undefined }))
    .filter((v): v is { label: string; ex: Exercise } => !!v.ex);

  const tags = [
    t(`levels.${exercise.level}`),
    exercise.typ === 'zeit'
      ? t('workout.seconds', { count: exercise.standard_dauer_s })
      : t('workout.reps', { count: exercise.standard_wdh }),
    exercise.wand ? t('exercise.wall') : null,
    exercise.boden ? t('exercise.floor') : t('exercise.noFloor'),
    exercise.schwangerschaft_geeignet ? null : t('exercise.notPregnancy'),
  ].filter((x): x is string => !!x);

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => router.back()} />
        <IconButton
          icon="heart"
          variant={favorite ? 'filled' : 'plain'}
          label={favorite ? t('exercise.unfavorite') : t('exercise.favorite')}
          onPress={() => toggleFavorite('exercise', exercise.id)}
        />
      </View>
      {media ? (
        <LoopVideo
          source={media.video}
          style={{ width: '100%', aspectRatio: 1 }}
          accessibilityLabel={t('exercise.video', { name })}
        />
      ) : null}
      <View style={{ gap: space.sm }}>
        <Text variant="title1">{name}</Text>
        <Text tone="muted">{localized(exercise.beschreibung, lang)}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>
      </View>

      <Section title={t('exercise.steps')}>
        {localized(exercise.schritte, lang).map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
            <Text variant="bodyStrong">{i + 1}.</Text>
            <Text style={{ flex: 1 }}>{s}</Text>
          </View>
        ))}
      </Section>

      <Section title={t('exercise.breathing')}>
        <Text>{localized(exercise.atemhinweis, lang)}</Text>
      </Section>

      <Section title={t('exercise.mistakes')}>
        {localized(exercise.fehler, lang).map((f, i) => (
          <Text key={i}>– {f}</Text>
        ))}
      </Section>

      <Section title={t('exercise.focus')}>
        <BodyMap
          zones={exercise.zielzonen}
          accessibilityLabel={t('exercise.focusLabel', {
            zones: exercise.zielzonen.map((z) => t(`zones.${z}`)).join(', '),
          })}
        />
        <Text variant="caption" tone="muted">
          {exercise.zielzonen.map((z) => t(`zones.${z}`)).join(' · ')}
        </Text>
      </Section>

      {variants.length > 0 ? (
        <Section title={t('exercise.variants')}>
          {variants.map((v) => (
            <ListItem
              key={v.ex.id}
              title={localized(v.ex.name, lang)}
              subtitle={v.label}
              thumbnail={getMedia(v.ex.id)?.thumbnail}
              onPress={() => router.push({ pathname: '/exercise', params: { id: v.ex.id } })}
            />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
