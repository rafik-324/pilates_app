import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { bmi, bmiCategory } from '@/domain/bmi';
import { weightForecast } from '@/domain/forecast';
import { isValidBirthYear, type StepId } from '@/domain/onboarding';
import type {
  Einheitensystem,
  Einschraenkung,
  Erfahrung,
  Geschlecht,
  Ziel,
  Zielzone,
} from '@/domain/profile';
import { cmToFtIn, ftInToCm, kgToLb, weightToKg } from '@/domain/units';
import { useTranslation } from '@/i18n';
import { useProfile } from '@/state/profile';
import { Button, Card, Chip, Icon, SelectCard, StatTile, Text, TextField } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { buildProfile } from './buildProfile';
import { StepLayout } from './StepLayout';
import { useOnboarding } from './store';

function useNext() {
  return useOnboarding((s) => s.next);
}

export function WelcomeStep() {
  const { t } = useTranslation();
  const { space } = useTheme();
  const next = useNext();
  return (
    <StepLayout
      showBack={false}
      title={t('onboarding.welcome.title')}
      subtitle={t('onboarding.welcome.subtitle')}
      primary={{ label: t('onboarding.welcome.start'), onPress: next }}
    >
      {['point1', 'point2', 'point3'].map((k) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Icon name="checkCircle" tone="success" />
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {t(`onboarding.welcome.${k}`)}
          </Text>
        </View>
      ))}
    </StepLayout>
  );
}

const GOALS: Ziel[] = ['abnehmen', 'straffen', 'flexibilitaet', 'haltung', 'stress'];

export function GoalStep() {
  const { t } = useTranslation();
  const { answers, set, next } = useOnboarding();
  return (
    <StepLayout
      title={t('onboarding.goal.title')}
      primary={{ label: t('common.continue'), onPress: next, disabled: !answers.ziel }}
    >
      {GOALS.map((g) => (
        <SelectCard
          key={g}
          title={t(`onboarding.goal.${g}`)}
          selected={answers.ziel === g}
          onPress={() => set({ ziel: g })}
        />
      ))}
    </StepLayout>
  );
}

const GENDERS: Geschlecht[] = ['weiblich', 'maennlich', 'divers', 'keine_angabe'];

export function GenderStep() {
  const { t } = useTranslation();
  const { answers, set, next } = useOnboarding();
  return (
    <StepLayout
      title={t('onboarding.gender.title')}
      subtitle={t('onboarding.gender.subtitle')}
      primary={{ label: t('common.continue'), onPress: next, disabled: !answers.geschlecht }}
    >
      {GENDERS.map((g) => (
        <SelectCard
          key={g}
          title={t(`onboarding.gender.${g}`)}
          selected={answers.geschlecht === g}
          onPress={() => set({ geschlecht: g })}
        />
      ))}
    </StepLayout>
  );
}

export function BirthYearStep() {
  const { t } = useTranslation();
  const { answers, set, next } = useOnboarding();
  const [text, setText] = useState(answers.geburtsjahr ? String(answers.geburtsjahr) : '');
  const [touched, setTouched] = useState(false);
  const year = Number(text);
  const valid = text.length === 4 && isValidBirthYear(year);

  const onNext = () => {
    setTouched(true);
    if (!valid) return;
    set({ geburtsjahr: year });
    // Zustand direkt aktualisieren, damit die Navigationslogik das neue Jahr sieht
    useOnboarding.setState((s) => ({ answers: { ...s.answers, geburtsjahr: year } }));
    next();
  };

  return (
    <StepLayout
      title={t('onboarding.birthyear.title')}
      subtitle={t('onboarding.birthyear.subtitle')}
      primary={{ label: t('common.continue'), onPress: onNext, disabled: text.length < 4 }}
    >
      <TextField
        label={t('onboarding.birthyear.label')}
        value={text}
        onChangeText={(v) => setText(v.replace(/\D/g, ''))}
        placeholder={t('onboarding.birthyear.placeholder')}
        keyboardType="number-pad"
        maxLength={4}
        error={touched && !valid ? t('onboarding.birthyear.invalid') : null}
      />
    </StepLayout>
  );
}

/** /F032/ und /T150/: Hinweis, es werden keine Daten gespeichert, das Onboarding endet. */
export function UnderageStep() {
  const { t } = useTranslation();
  const back = useOnboarding((s) => s.back);
  const set = useOnboarding((s) => s.set);
  return (
    <StepLayout
      showBack={false}
      title={t('onboarding.underage.title')}
      subtitle={t('onboarding.underage.text')}
      primary={{
        label: t('onboarding.underage.correct'),
        onPress: () => {
          set({ geburtsjahr: null });
          back();
        },
      }}
    />
  );
}

export function HealthNoticeStep() {
  const { t } = useTranslation();
  const { answers, set, next } = useOnboarding();
  return (
    <StepLayout
      title={t('onboarding.health.title')}
      primary={{
        label: t('common.continue'),
        onPress: next,
        disabled: !answers.gesundheitshinweisBestaetigt,
      }}
    >
      <Card>
        <Text>{t('onboarding.health.text')}</Text>
      </Card>
      <SelectCard
        multi
        title={t('onboarding.health.confirm')}
        selected={answers.gesundheitshinweisBestaetigt}
        onPress={() => set({ gesundheitshinweisBestaetigt: !answers.gesundheitshinweisBestaetigt })}
      />
    </StepLayout>
  );
}

/** /F038/: separate Einwilligung, nicht vorausgewählt. */
export function ConsentStep() {
  const { t } = useTranslation();
  const { set, next } = useOnboarding();
  const choose = (agree: boolean) => {
    useOnboarding.setState((s) => ({
      answers: { ...s.answers, einwilligungGesundheitsdaten: agree },
    }));
    next();
  };
  return (
    <StepLayout
      title={t('onboarding.consent.title')}
      primary={{ label: t('onboarding.consent.agree'), onPress: () => choose(true) }}
      secondary={{
        label: t('onboarding.consent.decline'),
        onPress: () => {
          set({ gewichtKg: null, groesseCm: null, zielgewichtKg: null });
          choose(false);
        },
      }}
    >
      <Card>
        <Text>{t('onboarding.consent.text')}</Text>
      </Card>
    </StepLayout>
  );
}

function parseNum(s: string): number | null {
  const n = Number(s.replace(',', '.'));
  return s.trim() !== '' && Number.isFinite(n) ? n : null;
}

const inRange = (v: number | null, min: number, max: number) =>
  v === null || (v >= min && v <= max);

/** /F040/: Körperdaten, Einheiten wählbar. Pro Einheitensystem ein eigenes Formular (key), das aus den Antworten startet. */
export function BodyStep() {
  const system = useOnboarding((s) => s.answers.einheitensystem);
  return <BodyForm key={system} />;
}

function BodyForm() {
  const { t } = useTranslation();
  const { space } = useTheme();
  const { answers, set, next } = useOnboarding();
  const imperial = answers.einheitensystem === 'imperial';

  const ftin = answers.groesseCm ? cmToFtIn(answers.groesseCm) : null;
  const toDisplay = (kg: number | null) =>
    kg ? String(Math.round((imperial ? kgToLb(kg) : kg) * 10) / 10) : '';
  const [cm, setCm] = useState(answers.groesseCm ? String(answers.groesseCm) : '');
  const [ft, setFt] = useState(ftin ? String(ftin.ft) : '');
  const [inch, setInch] = useState(ftin ? String(ftin.in) : '');
  const [w, setW] = useState(toDisplay(answers.gewichtKg));
  const [tw, setTw] = useState(toDisplay(answers.zielgewichtKg));
  const [touched, setTouched] = useState(false);

  const heightCm = imperial
    ? parseNum(ft) !== null
      ? ftInToCm(parseNum(ft) ?? 0, parseNum(inch) ?? 0)
      : null
    : parseNum(cm);
  const weightKg =
    parseNum(w) === null ? null : weightToKg(parseNum(w) as number, answers.einheitensystem);
  const targetKg =
    parseNum(tw) === null ? null : weightToKg(parseNum(tw) as number, answers.einheitensystem);
  const valid =
    inRange(heightCm, 120, 230) && inRange(weightKg, 30, 300) && inRange(targetKg, 30, 300);

  const onNext = () => {
    setTouched(true);
    if (!valid) return;
    set({ groesseCm: heightCm, gewichtKg: weightKg, zielgewichtKg: targetKg });
    next();
  };

  const switchUnits = (system: Einheitensystem) =>
    set({
      einheitensystem: system,
      groesseCm: heightCm,
      gewichtKg: weightKg,
      zielgewichtKg: targetKg,
    });

  const error = touched && !valid ? t('onboarding.body.invalid') : null;
  const wUnit = imperial ? t('onboarding.body.lb') : t('onboarding.body.kg');

  return (
    <StepLayout
      title={t('onboarding.body.title')}
      subtitle={t('onboarding.body.subtitle')}
      primary={{ label: t('common.continue'), onPress: onNext }}
      secondary={{
        label: t('onboarding.skip'),
        onPress: () => {
          set({ groesseCm: null, gewichtKg: null, zielgewichtKg: null });
          next();
        },
      }}
    >
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip
          label={t('onboarding.body.metric')}
          selected={!imperial}
          onPress={() => switchUnits('metrisch')}
        />
        <Chip
          label={t('onboarding.body.imperial')}
          selected={imperial}
          onPress={() => switchUnits('imperial')}
        />
      </View>
      {imperial ? (
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <TextField
            label={`${t('onboarding.body.height')} (${t('onboarding.body.ft')})`}
            value={ft}
            onChangeText={setFt}
            keyboardType="number-pad"
            suffix={t('onboarding.body.ft')}
            maxLength={1}
          />
          <TextField
            label={`${t('onboarding.body.height')} (${t('onboarding.body.in')})`}
            value={inch}
            onChangeText={setInch}
            keyboardType="number-pad"
            suffix={t('onboarding.body.in')}
            maxLength={2}
          />
        </View>
      ) : (
        <TextField
          label={t('onboarding.body.height')}
          value={cm}
          onChangeText={setCm}
          keyboardType="decimal-pad"
          suffix={t('onboarding.body.cm')}
          maxLength={5}
        />
      )}
      <TextField
        label={t('onboarding.body.weight')}
        value={w}
        onChangeText={setW}
        keyboardType="decimal-pad"
        suffix={wUnit}
        maxLength={5}
      />
      <TextField
        label={t('onboarding.body.target')}
        value={tw}
        onChangeText={setTw}
        keyboardType="decimal-pad"
        suffix={wUnit}
        maxLength={5}
        error={error}
      />
    </StepLayout>
  );
}

const LEVELS: { level: Erfahrung; key: 'none' | 'some' | 'regular' }[] = [
  { level: 1, key: 'none' },
  { level: 2, key: 'some' },
  { level: 3, key: 'regular' },
];

export function ExperienceStep() {
  const { t } = useTranslation();
  const { answers, set, next } = useOnboarding();
  return (
    <StepLayout
      title={t('onboarding.experience.title')}
      primary={{ label: t('common.continue'), onPress: next }}
    >
      {LEVELS.map(({ level, key }) => (
        <SelectCard
          key={key}
          title={t(`onboarding.experience.${key}`)}
          subtitle={t(`onboarding.experience.${key}Hint`)}
          selected={answers.level === level}
          onPress={() => set({ level })}
        />
      ))}
    </StepLayout>
  );
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

const ZONES: Zielzone[] = ['bauch', 'arme', 'brust', 'po', 'beine', 'ganzkoerper'];

export function ZonesStep() {
  const { t } = useTranslation();
  const { answers, set, next } = useOnboarding();
  return (
    <StepLayout
      title={t('onboarding.zones.title')}
      subtitle={t('onboarding.zones.subtitle')}
      primary={{
        label: t('common.continue'),
        onPress: next,
        disabled: answers.zielzonen.length === 0,
      }}
    >
      {ZONES.map((z) => (
        <SelectCard
          multi
          key={z}
          title={t(`onboarding.zones.${z}`)}
          selected={answers.zielzonen.includes(z)}
          onPress={() => set({ zielzonen: toggle(answers.zielzonen, z) })}
        />
      ))}
    </StepLayout>
  );
}

const LIMITS: Einschraenkung[] = [
  'knie',
  'ruecken',
  'handgelenke',
  'kein_boden',
  'schwangerschaft',
];

export function LimitsStep() {
  const { t } = useTranslation();
  const { answers, set, next } = useOnboarding();
  return (
    <StepLayout
      title={t('onboarding.limits.title')}
      subtitle={t('onboarding.limits.subtitle')}
      primary={{ label: t('common.continue'), onPress: next }}
    >
      {LIMITS.map((l) => (
        <SelectCard
          multi
          key={l}
          title={t(`onboarding.limits.${l}`)}
          selected={answers.einschraenkungen.includes(l)}
          onPress={() => set({ einschraenkungen: toggle(answers.einschraenkungen, l) })}
        />
      ))}
    </StepLayout>
  );
}

/** /F070/: bei Schwangerschaft erneuter Arzthinweis. */
export function PregnancyNoticeStep() {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);
  const next = useNext();
  return (
    <StepLayout
      title={t('onboarding.pregnancy.title')}
      primary={{ label: t('common.continue'), onPress: next, disabled: !confirmed }}
    >
      <Card>
        <Text>{t('onboarding.pregnancy.text')}</Text>
      </Card>
      <SelectCard
        multi
        title={t('onboarding.pregnancy.confirm')}
        selected={confirmed}
        onPress={() => setConfirmed(!confirmed)}
      />
    </StepLayout>
  );
}

const DAYS = [2, 3, 4, 5, 6];
const TIMES: { key: string; value: string | null }[] = [
  { key: 'morning', value: '07:00' },
  { key: 'noon', value: '12:00' },
  { key: 'evening', value: '18:00' },
  { key: 'night', value: '21:00' },
  { key: 'none', value: null },
];

export function ScheduleStep() {
  const { t } = useTranslation();
  const { space } = useTheme();
  const { answers, set, next } = useOnboarding();
  return (
    <StepLayout
      title={t('onboarding.schedule.title')}
      primary={{ label: t('common.continue'), onPress: next }}
    >
      <Text variant="bodyStrong">{t('onboarding.schedule.daysLabel')}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {DAYS.map((d) => (
          <Chip
            key={d}
            label={String(d)}
            selected={answers.trainingstageProWoche === d}
            onPress={() => set({ trainingstageProWoche: d })}
          />
        ))}
      </View>
      <Text variant="bodyStrong">{t('onboarding.schedule.timeLabel')}</Text>
      {TIMES.map((x) => (
        <SelectCard
          key={x.key}
          title={t(`onboarding.schedule.${x.key}`)}
          selected={answers.trainingUhrzeit === x.value}
          onPress={() => set({ trainingUhrzeit: x.value })}
        />
      ))}
    </StepLayout>
  );
}

/** /F090/: Planvorschau, mit Einwilligung inkl. BMI und Zielprognose. */
export function PreviewStep() {
  const { t } = useTranslation();
  const { space } = useTheme();
  const { answers, next } = useOnboarding();
  const consent = answers.einwilligungGesundheitsdaten;
  const hasWeight = consent && answers.gewichtKg !== null && answers.groesseCm !== null;
  const bmiValue = hasWeight ? bmi(answers.gewichtKg as number, answers.groesseCm as number) : null;
  const forecast =
    consent && answers.gewichtKg !== null && answers.zielgewichtKg !== null
      ? weightForecast(answers.gewichtKg, answers.zielgewichtKg, answers.groesseCm)
      : null;
  const levelKey = (['none', 'some', 'regular'] as const)[answers.level - 1];

  return (
    <StepLayout
      title={t('onboarding.preview.title')}
      subtitle={t('onboarding.preview.subtitle')}
      primary={{ label: t('common.continue'), onPress: next }}
    >
      <Card variant="inverse">
        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <StatTile value="30" label={t('onboarding.preview.days')} />
          <StatTile
            value={`${answers.trainingstageProWoche}x`}
            label={t('onboarding.preview.perWeek')}
          />
        </View>
        <Text tone="onInverse" variant="caption">
          {t('onboarding.preview.level')}: {t(`onboarding.experience.${levelKey}`)}
        </Text>
        <Text tone="onInverse" variant="caption">
          {t('onboarding.preview.zones')}:{' '}
          {answers.zielzonen.map((z) => t(`onboarding.zones.${z}`)).join(', ')}
        </Text>
      </Card>
      {bmiValue !== null ? (
        <Card>
          <Text variant="caption" tone="muted">
            {t('onboarding.preview.bmi')}
          </Text>
          <Text variant="title2">
            {bmiValue} · {t(`onboarding.preview.bmi${capitalize(bmiCategory(bmiValue))}`)}
          </Text>
        </Card>
      ) : null}
      {forecast ? (
        <Card>
          <Text variant="title3">{t('onboarding.preview.forecastTitle')}</Text>
          <Text tone="muted">
            {forecast.targetTooLow
              ? t('onboarding.preview.forecastLow')
              : forecast.weeks > 0
                ? t('onboarding.preview.forecastWeeks', { count: forecast.weeks })
                : t('onboarding.preview.forecastNone')}
          </Text>
        </Card>
      ) : null}
      {!consent ? (
        <Card>
          <Text tone="muted">{t('onboarding.preview.noWeight')}</Text>
        </Card>
      ) : null}
    </StepLayout>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** /F100/ und Abschluss: Profil speichern, danach zur Plan-Startseite. */
export function NotificationsStep() {
  const { t } = useTranslation();
  const { space } = useTheme();
  const [busy, setBusy] = useState(false);

  const finish = async (ask: boolean) => {
    setBusy(true);
    if (ask) {
      try {
        await Notifications.requestPermissionsAsync();
      } catch (e) {
        console.warn('[Onboarding] Benachrichtigungsberechtigung nicht verfügbar', e);
      }
    }
    useProfile.getState().save(buildProfile(useOnboarding.getState().answers));
    useOnboarding.getState().reset();
    router.replace('/');
  };

  return (
    <StepLayout title={t('onboarding.notifications.title')}>
      <Card>
        <Text>{t('onboarding.notifications.text')}</Text>
      </Card>
      <View style={{ gap: space.sm }}>
        <Button
          title={t('onboarding.notifications.allow')}
          size="lg"
          fullWidth
          loading={busy}
          onPress={() => void finish(true)}
        />
        <Button
          title={t('onboarding.notifications.later')}
          variant="ghost"
          fullWidth
          disabled={busy}
          onPress={() => void finish(false)}
        />
      </View>
    </StepLayout>
  );
}

export const STEP_COMPONENTS: Record<StepId, React.ComponentType> = {
  welcome: WelcomeStep,
  goal: GoalStep,
  gender: GenderStep,
  birthyear: BirthYearStep,
  underage: UnderageStep,
  health_notice: HealthNoticeStep,
  consent: ConsentStep,
  body: BodyStep,
  experience: ExperienceStep,
  zones: ZonesStep,
  limits: LimitsStep,
  pregnancy_notice: PregnancyNoticeStep,
  schedule: ScheduleStep,
  preview: PreviewStep,
  notifications: NotificationsStep,
};
