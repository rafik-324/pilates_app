import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Share, View } from 'react-native';
import { getRepositories } from '@/data/init';
import { toDateKey } from '@/domain/dates';
import type { FeedbackValue } from '@/domain/profile';
import { parseWeightInput } from '@/domain/progress';
import { displayWeight, weightToKg } from '@/domain/units';
import { getPlanService } from '@/features/plan/store';
import { loadProgress } from '@/features/progress/service';
import { addWeight } from '@/features/progress/weight';
import { useTranslation } from '@/i18n';
import { useProfile } from '@/state/profile';
import { Button, Card, Chip, Icon, Screen, StatTile, Text, TextField } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { formatClock } from './format';

const FEEDBACK: FeedbackValue[] = ['zu_leicht', 'passend', 'zu_schwer'];

/** Abschlussbildschirm (/F700/ bis /F730/): Kennzahlen, Streak, Feedback, Gewicht. */
export function CompleteScreen() {
  const { t } = useTranslation();
  const { space, colors, radius } = useTheme();
  const { session } = useLocalSearchParams<{ session?: string }>();
  const profile = useProfile((s) => s.profile);
  const [feedback, setFeedback] = useState<FeedbackValue | null>(null);
  const [adapted, setAdapted] = useState(false);
  const [weightText, setWeightText] = useState('');
  const [weightSaved, setWeightSaved] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);

  const record = useMemo(
    () => (session ? getRepositories().sessions.get(Number(session)) : null),
    [session],
  );
  const streak = useMemo(() => loadProgress(getRepositories(), profile).streak, [profile]);
  const consent = !!profile?.einwilligungGesundheitsdaten;
  const system = profile?.einheitensystem ?? 'metrisch';
  const unit = displayWeight(1, system).unit;

  const chooseFeedback = (f: FeedbackValue) => {
    if (!record) return;
    setFeedback(f);
    getRepositories().sessions.setFeedback(record.id, f);
    // Adaptive Anpassung der Folgetage (/F270/), nur einmal je Session
    if (!adapted && profile && record.planId !== null && record.planTagNr !== null) {
      getPlanService().applyFeedback(record.planId, record.planTagNr, f, profile);
      setAdapted(true);
    }
  };

  const saveWeight = () => {
    const kg = parseWeightInput(weightText, (v) => weightToKg(v, system));
    if (kg === null) {
      setWeightError(t('complete.weightInvalid'));
      return;
    }
    setWeightError(null);
    if (addWeight(toDateKey(new Date()), kg)) setWeightSaved(true);
  };

  const share = () => {
    if (!record) return;
    void Share.share({
      message: t('complete.shareText', {
        minutes: Math.max(1, Math.round(record.dauerS / 60)),
        count: record.uebungenErledigt,
      }),
    });
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ alignItems: 'center', gap: space.md, paddingTop: space.xl }}>
        <View
          accessible
          accessibilityLabel={t('complete.title')}
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
        <>
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <StatTile large value={formatClock(record.dauerS)} label={t('complete.duration')} />
            <StatTile
              large
              value={String(record.uebungenErledigt)}
              label={t('complete.exercises')}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <StatTile
              large
              value={(record.kcalGeschaetzt ? '~' : '') + Math.round(record.kcal)}
              label={t('complete.kcal')}
            />
            <StatTile large value={String(streak)} label={t('complete.streak')} />
          </View>
          {record.kcalGeschaetzt ? (
            <Text variant="caption" tone="muted">
              {t('workout.kcalEstimateHint')}
            </Text>
          ) : null}
        </>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Text variant="title3">{t('complete.feedbackTitle')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {FEEDBACK.map((f) => (
            <Chip
              key={f}
              label={t(`complete.feedback_${f}`)}
              selected={feedback === f}
              onPress={() => chooseFeedback(f)}
            />
          ))}
        </View>
        {feedback && adapted && feedback !== 'passend' ? (
          <Text variant="caption" tone="muted">
            {t(`complete.adapted_${feedback}`)}
          </Text>
        ) : null}
      </View>

      {consent ? (
        <Card>
          <Text variant="title3">{t('complete.weightTitle')}</Text>
          {weightSaved ? (
            <Text tone="success">{t('complete.weightSaved')}</Text>
          ) : (
            <>
              <TextField
                label={t('complete.weightLabel')}
                value={weightText}
                onChangeText={setWeightText}
                keyboardType="decimal-pad"
                suffix={unit}
                error={weightError}
              />
              <Button title={t('common.save')} variant="secondary" onPress={saveWeight} />
            </>
          )}
        </Card>
      ) : null}

      <Button title={t('complete.done')} size="lg" fullWidth onPress={() => router.replace('/')} />
      <Button title={t('complete.share')} variant="ghost" fullWidth onPress={share} />
    </Screen>
  );
}
