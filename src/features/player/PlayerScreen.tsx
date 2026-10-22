import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { getExercise, getMedia } from '@/data/content/loader';
import type { AbortReason } from '@/data/repositories/sessions';
import { localized } from '@/domain/content';
import {
  completeReps,
  extendRest,
  isPaused,
  next,
  pause,
  previous,
  progress,
  remainingS,
  resume,
  type PlayerEvent,
  type PlayerState,
} from '@/domain/player';
import { useWorkoutLaunch } from '@/features/workout/launch';
import type { ResolvedWorkout } from '@/features/workout/resolve';
import { useLang, useTranslation } from '@/i18n';
import { useProfile } from '@/state/profile';
import { useSettings } from '@/state/settings';
import {
  Button,
  Chip,
  Dialog,
  IconButton,
  LoopVideo,
  ProgressBar,
  Screen,
  Sheet,
  Text,
} from '@/ui/components';
import { ThemeProvider, useTheme } from '@/ui/theme';
import { useAudioCues } from './audio';
import { formatClock } from './format';
import type { ResumeSnapshot } from './service';
import { getPlayerService } from './store';
import { usePlayerController } from './usePlayerController';

const REASONS: AbortReason[] = ['zu_schwer', 'keine_zeit', 'sonstiges'];

/** Workout-Player (/F500/ bis /F630/), immer im dunklen Farbschema. */
export function PlayerScreen() {
  const { resume: resumeParam } = useLocalSearchParams<{ resume?: string }>();
  const pending = useWorkoutLaunch((s) => s.pending);
  const [snapshot] = useState<ResumeSnapshot | null>(() =>
    resumeParam ? getPlayerService().loadSnapshot() : null,
  );
  const workout = snapshot?.workout ?? pending;

  return (
    <ThemeProvider forceScheme="dark">
      <StatusBar style="light" />
      {workout ? <Player workout={workout} snapshot={snapshot} /> : <Missing />}
    </ThemeProvider>
  );
}

function Missing() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text tone="muted">{t('workout.notFound')}</Text>
      <Button title={t('common.back')} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function Player({
  workout,
  snapshot,
}: {
  workout: ResolvedWorkout;
  snapshot: ResumeSnapshot | null;
}) {
  useKeepAwake();
  const { t } = useTranslation();
  const lang = useLang();
  const { space } = useTheme();
  const settings = useSettings();
  const profile = useProfile((s) => s.profile);
  const weightKg = profile?.einwilligungGesundheitsdaten ? profile.gewichtKg : null;
  const service = useMemo(() => getPlayerService(), []);
  const sessionId = useRef<number | null>(snapshot?.sessionId ?? null);
  const finished = useRef(false);

  const [abortOpen, setAbortOpen] = useState(false);
  const [reason, setReason] = useState<AbortReason | null>(null);
  const [soundOpen, setSoundOpen] = useState(false);
  const [doneSession, setDoneSession] = useState<number | null>(null);

  const nameOf = useCallback(
    (state: PlayerState, i: number) => {
      const ex = getExercise(state.items[i]?.exerciseId ?? '');
      return ex ? localized(ex.name, lang) : '';
    },
    [lang],
  );

  const [active, setActive] = useState(true);
  const audio = useAudioCues({
    lang,
    voice: settings.stimme,
    voiceVolume: settings.lautstaerkeStimme,
    musicOn: settings.musikAn,
    musicVolume: settings.lautstaerkeMusik,
    active,
  });

  const onEvents = useCallback(
    (events: PlayerEvent[], state: PlayerState) => {
      for (const ev of events) {
        if (ev.type === 'countdown') audio.playBeep();
        else if (ev.type === 'halfway') audio.speak(t('player.say.halfway'));
        else if (ev.type === 'done') audio.speak(t('player.say.done'));
        else if (ev.type === 'phase') {
          const item = state.items[ev.index];
          const name = nameOf(state, ev.index);
          if (ev.phase === 'prepare') audio.speak(t('player.say.prepare', { name }));
          else if (ev.phase === 'rest') audio.speak(t('player.say.rest', { name }));
          else if (ev.phase === 'exercise') {
            audio.speak(
              item.kind === 'time'
                ? t('player.say.startTime', { name, count: item.durationS ?? 0 })
                : t('player.say.startReps', { name, count: item.reps ?? 0 }),
            );
          }
        }
      }
    },
    [audio, nameOf, t],
  );

  const onPersist = useCallback(
    (state: PlayerState) => {
      if (finished.current) return;
      if (state.phase === 'done') {
        finished.current = true;
        const id = service.recordSession({
          workout,
          state,
          now: Date.now(),
          weightKg,
          aborted: false,
          sessionId: sessionId.current,
        });
        setActive(false);
        setDoneSession(id);
        return;
      }
      service.saveSnapshot({ workout, state, sessionId: sessionId.current }, Date.now());
    },
    [service, workout, weightKg],
  );

  const { state, now, act } = usePlayerController({
    workout,
    initial: snapshot?.state ?? null,
    countdownS: settings.countdownS,
    restS: settings.pauseS,
    getExercise,
    onEvents,
    onPersist,
  });

  useEffect(() => {
    if (doneSession !== null) {
      router.replace({ pathname: '/complete', params: { session: String(doneSession) } });
    }
  }, [doneSession]);

  const openAbort = useCallback(() => {
    act(pause);
    setAbortOpen(true);
  }, [act]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      openAbort();
      return true;
    });
    return () => sub.remove();
  }, [openAbort]);

  const confirmAbort = () => {
    const t0 = Date.now();
    sessionId.current = service.recordSession({
      workout,
      state,
      now: t0,
      weightKg,
      aborted: true,
      reason,
      sessionId: sessionId.current,
    });
    service.saveSnapshot({ workout, state, sessionId: sessionId.current }, t0);
    finished.current = true;
    setActive(false);
    setAbortOpen(false);
    router.back();
  };

  const paused = isPaused(state);
  const remaining = remainingS(state, now);
  const item = state.items[state.index];
  const ex = getExercise(item?.exerciseId ?? '');
  const media = ex ? getMedia(ex.id) : undefined;
  const name = ex ? localized(ex.name, lang) : '';
  const n = state.items.length;

  let label: string;
  if (state.phase === 'prepare') label = t('player.getReady');
  else if (state.phase === 'rest') label = t('player.rest');
  else label = t('player.exerciseOf', { n: state.index + 1, total: n });

  const bigValue =
    state.phase === 'exercise' && item.kind === 'reps'
      ? t('player.reps', { count: item.reps ?? 0 })
      : formatClock(remaining ?? 0);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, gap: space.md, paddingVertical: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <IconButton icon="close" label={t('player.abort')} onPress={openAbort} />
          <View style={{ flex: 1 }}>
            <ProgressBar progress={progress(state, now)} />
          </View>
          <IconButton icon="volume" label={t('player.sound')} onPress={() => setSoundOpen(true)} />
        </View>

        <View style={{ flex: 1, minHeight: 0 }}>
          {media ? (
            <LoopVideo
              source={media.video}
              paused={paused}
              style={{ flex: 1 }}
              accessibilityLabel={t('exercise.video', { name })}
            />
          ) : null}
        </View>

        <View style={{ alignItems: 'center', gap: space.xs }}>
          <Text variant="caption" tone="muted">
            {state.phase === 'exercise' ? label : `${label} · ${t('player.next')}`}
          </Text>
          <Text variant="title2" align="center">
            {name}
          </Text>
          <Text
            variant="timer"
            tone={state.phase === 'exercise' ? 'text' : 'accent'}
            accessibilityLabel={bigValue}
            accessibilityLiveRegion="polite"
          >
            {bigValue}
          </Text>
          {paused ? (
            <Text variant="bodyStrong" tone="muted">
              {t('player.paused')}
            </Text>
          ) : null}
        </View>

        {state.phase === 'exercise' ? (
          <View style={{ gap: space.md }}>
            {item.kind === 'reps' ? (
              <Button
                title={t('player.repsDone')}
                size="lg"
                fullWidth
                onPress={() => act(completeReps)}
              />
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <IconButton
                icon="previous"
                size="lg"
                label={t('player.previous')}
                onPress={() => act(previous)}
              />
              <IconButton
                icon={paused ? 'play' : 'pause'}
                size="lg"
                variant={item.kind === 'reps' ? 'filled' : 'primary'}
                label={paused ? t('player.resume') : t('player.pause')}
                onPress={() => act(paused ? resume : pause)}
              />
              <IconButton
                icon="next"
                size="lg"
                label={t('player.skip')}
                onPress={() => act(next)}
              />
            </View>
          </View>
        ) : (
          <View style={{ gap: space.sm }}>
            <Button
              title={state.phase === 'rest' ? t('player.skipRest') : t('player.startNow')}
              size="lg"
              fullWidth
              onPress={() => act(next)}
            />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {state.phase === 'rest' ? (
                <Button
                  title={t('player.plus20')}
                  variant="secondary"
                  style={{ flex: 1 }}
                  fullWidth
                  onPress={() => act((s) => extendRest(s, 20))}
                />
              ) : null}
              <Button
                title={paused ? t('player.resume') : t('player.pause')}
                variant="secondary"
                style={{ flex: 1 }}
                fullWidth
                onPress={() => act(paused ? resume : pause)}
              />
            </View>
          </View>
        )}
      </View>

      <Dialog
        visible={abortOpen}
        title={t('player.abortTitle')}
        message={t('player.abortMessage')}
        confirmLabel={t('player.abortConfirm')}
        cancelLabel={t('player.continue')}
        destructive
        onConfirm={confirmAbort}
        onCancel={() => {
          setAbortOpen(false);
          act(resume);
        }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {REASONS.map((r) => (
            <Chip
              key={r}
              label={t(`player.reason_${r}`)}
              selected={reason === r}
              onPress={() => setReason(reason === r ? null : r)}
            />
          ))}
        </View>
      </Dialog>

      <Sheet visible={soundOpen} title={t('player.sound')} onClose={() => setSoundOpen(false)}>
        <SoundSettings />
        <Button
          title={t('common.close')}
          variant="secondary"
          fullWidth
          onPress={() => setSoundOpen(false)}
        />
      </Sheet>
    </Screen>
  );
}

const STEP = 0.2;

/** Musik an / aus und getrennte Lautstärken für Stimme und Musik (/F560/). */
function SoundSettings() {
  const { t } = useTranslation();
  const { space } = useTheme();
  const s = useSettings();
  const row = (label: string, value: number, set: (v: number) => void) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <Text style={{ flex: 1 }}>{label}</Text>
      <IconButton
        icon="minus"
        label={t('player.quieter', { what: label })}
        onPress={() => set(Math.max(0, Math.round((value - STEP) * 10) / 10))}
      />
      <Text variant="bodyStrong">{`${Math.round(value * 100)} %`}</Text>
      <IconButton
        icon="plus"
        label={t('player.louder', { what: label })}
        onPress={() => set(Math.min(1, Math.round((value + STEP) * 10) / 10))}
      />
    </View>
  );
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip
          label={t('player.musicOn')}
          selected={s.musikAn}
          onPress={() => s.update({ musikAn: true })}
        />
        <Chip
          label={t('player.musicOff')}
          selected={!s.musikAn}
          onPress={() => s.update({ musikAn: false })}
        />
      </View>
      {row(t('player.voiceVolume'), s.lautstaerkeStimme, (v) => s.update({ lautstaerkeStimme: v }))}
      {row(t('player.musicVolume'), s.lautstaerkeMusik, (v) => s.update({ lautstaerkeMusik: v }))}
      <Text variant="caption" tone="muted">
        {t('player.duckingHint')}
      </Text>
    </View>
  );
}
