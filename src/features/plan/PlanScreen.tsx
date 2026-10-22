import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { getContent } from '@/data/content/loader';
import { localized } from '@/domain/content';
import { useLang, useTranslation } from '@/i18n';
import { getPlayerService } from '@/features/player/store';
import type { ResumeSnapshot } from '@/features/player/service';
import { refToParams } from '@/features/workout/resolve';
import { useProfile } from '@/state/profile';
import {
  Button,
  Card,
  Chip,
  Dialog,
  Icon,
  ListItem,
  ProgressBar,
  Screen,
  Text,
} from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { DayGrid } from './DayGrid';
import type { DayView } from './service';
import { getPlanService, usePlan } from './store';

type Confirm =
  null | { kind: 'reset' } | { kind: 'endChallenge' } | { kind: 'startChallenge'; id: string };

/** Plan-Tab (/F210/, /F220/, /F250/, /F260/): Tageskarte, Raster der Tage, Challenges. */
export function PlanScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const { space } = useTheme();
  const profile = useProfile((s) => s.profile);
  const { personal, challenge, refresh } = usePlan();
  const [tab, setTab] = useState<'personal' | 'challenge'>('personal');
  const [confirm, setConfirm] = useState<Confirm>(null);

  const [resumable, setResumable] = useState<ResumeSnapshot | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
      setResumable(getPlayerService().loadSnapshot());
    }, [refresh]),
  );

  const view = tab === 'challenge' && challenge ? challenge : personal;
  if (!view || !profile) return <Screen>{null}</Screen>;

  const challenges = getContent().challenges;
  const current = view.current;

  const openDay = (day: DayView) => {
    if (day.ruhetag) return;
    router.push({
      pathname: '/workout',
      params: refToParams({ kind: 'plan', planId: view.plan.id, tagNr: day.tagNr }),
    });
  };

  const completeRest = () => {
    if (!current) return;
    getPlanService().completeDay(view.plan.id, current.tagNr);
    refresh();
  };

  const runConfirm = () => {
    const service = getPlanService();
    if (confirm?.kind === 'reset') {
      service.resetPersonalPlan(profile);
      setTab('personal');
    } else if (confirm?.kind === 'endChallenge') {
      service.endChallenge();
      setTab('personal');
    } else if (confirm?.kind === 'startChallenge') {
      service.startChallenge(confirm.id);
    }
    setConfirm(null);
    refresh();
    if (confirm?.kind === 'startChallenge') setTab('challenge');
  };

  const kcalText = (d: DayView) =>
    d.stats
      ? t(d.stats.kcalEstimated ? 'plan.estimate' : 'plan.kcal', { count: d.stats.kcal })
      : '';

  return (
    <Screen scroll>
      <Text variant="title1">{t('plan.title')}</Text>

      {challenge ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip
            label={t('plan.myPlan')}
            selected={tab === 'personal'}
            onPress={() => setTab('personal')}
          />
          <Chip
            label={challenge.challenge ? localized(challenge.challenge.titel, lang) : ''}
            selected={tab === 'challenge'}
            onPress={() => setTab('challenge')}
          />
        </View>
      ) : null}

      {resumable ? (
        <Card>
          <Text variant="title3">{t('player.resumeTitle')}</Text>
          <Text tone="muted">
            {resumable.workout.title
              ? localized(resumable.workout.title, lang)
              : t('plan.day', { n: resumable.workout.tagNr })}
          </Text>
          <Button
            title={t('player.resumeAction')}
            variant="secondary"
            fullWidth
            onPress={() => router.push({ pathname: '/player', params: { resume: '1' } })}
          />
          <Button
            title={t('player.resumeDiscard')}
            variant="ghost"
            fullWidth
            onPress={() => setDiscardOpen(true)}
          />
        </Card>
      ) : null}

      {current ? (
        <Card variant="inverse">
          <Text variant="title1" tone="onInverse">
            {t('plan.day', { n: current.tagNr })}
          </Text>
          {current.ruhetag ? (
            <>
              <Text tone="onInverse">{t('plan.restHint')}</Text>
              <Button title={t('plan.completeRest')} fullWidth onPress={completeRest} />
            </>
          ) : (
            <>
              <Text tone="onInverse">
                {[
                  t('common.min', { count: current.stats?.minutes }),
                  t('plan.exercises', { count: current.stats?.exerciseCount }),
                  kcalText(current),
                ].join(' · ')}
              </Text>
              <Button
                title={t('plan.start')}
                fullWidth
                size="lg"
                onPress={() => openDay(current)}
              />
            </>
          )}
        </Card>
      ) : (
        <Card variant="inverse">
          <Text variant="title1" tone="onInverse">
            {t('plan.allDone')}
          </Text>
          <Text tone="onInverse">{t('plan.allDoneHint')}</Text>
          {tab === 'personal' ? (
            <Button
              title={t('plan.newPlan')}
              fullWidth
              onPress={() => setConfirm({ kind: 'reset' })}
            />
          ) : (
            <Button
              title={t('plan.challengeEnd')}
              fullWidth
              onPress={() => setConfirm({ kind: 'endChallenge' })}
            />
          )}
        </Card>
      )}

      <View style={{ gap: space.sm }}>
        <Text variant="title3">{t('plan.gridTitle')}</Text>
        <ProgressBar progress={view.days.length ? view.doneCount / view.days.length : 0} />
        <Text variant="caption" tone="muted">
          {t('plan.progress', { done: view.doneCount, total: view.days.length })}
        </Text>
        <DayGrid days={view.days} onPressDay={openDay} />
      </View>

      <View style={{ gap: space.sm }}>
        <Text variant="title3">{t('plan.challenges')}</Text>
        {challenges.map((c) => {
          const active = challenge?.challenge?.id === c.id;
          return (
            <Card key={c.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="title3" style={{ flex: 1 }}>
                  {localized(c.titel, lang)}
                </Text>
                {c.premium ? <Icon name="lock" size={18} tone="muted" /> : null}
              </View>
              <Text tone="muted">{localized(c.beschreibung, lang)}</Text>
              <Text variant="caption" tone="muted">
                {t('plan.challengeDays', { count: c.tage })}
              </Text>
              {active ? (
                <Text variant="bodyStrong" tone="success">
                  {t('plan.challengeActive')}
                </Text>
              ) : (
                <Button
                  title={t('plan.challengeStart')}
                  variant="secondary"
                  onPress={() =>
                    challenge ? setConfirm({ kind: 'startChallenge', id: c.id }) : directStart(c.id)
                  }
                />
              )}
            </Card>
          );
        })}
      </View>

      <View>
        {challenge ? (
          <ListItem
            title={t('plan.challengeEnd')}
            leftIcon="close"
            onPress={() => setConfirm({ kind: 'endChallenge' })}
          />
        ) : null}
        <ListItem
          title={t('plan.reset')}
          leftIcon="restart"
          onPress={() => setConfirm({ kind: 'reset' })}
        />
      </View>

      <Dialog
        visible={discardOpen}
        title={t('player.discardTitle')}
        message={t('player.discardMessage')}
        confirmLabel={t('player.resumeDiscard')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          getPlayerService().clearSnapshot();
          setResumable(null);
          setDiscardOpen(false);
        }}
        onCancel={() => setDiscardOpen(false)}
      />

      <Dialog
        visible={confirm !== null}
        title={
          confirm?.kind === 'reset'
            ? t('plan.resetTitle')
            : confirm?.kind === 'endChallenge'
              ? t('plan.challengeEndTitle')
              : t('plan.challengeStartTitle')
        }
        message={
          confirm?.kind === 'reset'
            ? t('plan.resetMessage')
            : confirm?.kind === 'endChallenge'
              ? t('plan.challengeEndMessage')
              : t('plan.challengeStartMessage')
        }
        confirmLabel={confirm?.kind === 'reset' ? t('plan.resetConfirm') : t('common.confirm')}
        cancelLabel={t('common.cancel')}
        destructive={confirm?.kind !== 'startChallenge'}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );

  function directStart(id: string) {
    getPlanService().startChallenge(id);
    refresh();
    setTab('challenge');
  }
}
