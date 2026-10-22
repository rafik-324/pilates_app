import { File, Paths } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { getRepositories } from '@/data/init';
import type { SessionRecord } from '@/data/repositories/sessions';
import type { WeightEntry } from '@/data/repositories/weight';
import { addDays, startOfWeek, toDateKey, type DateKey } from '@/domain/dates';
import {
  buildCsv,
  dayOfMonth,
  monthGrid,
  parseWeightInput,
  shiftMonth,
  weekMinutes,
  weightSeries,
} from '@/domain/progress';
import { displayWeight, weightToKg } from '@/domain/units';
import { useLang, useTranslation, type AppLanguage } from '@/i18n';
import { useProfile } from '@/state/profile';
import {
  BarChart,
  Button,
  Card,
  Dialog,
  IconButton,
  LineChart,
  ListItem,
  Screen,
  Sheet,
  StatTile,
  Text,
  TextField,
} from '@/ui/components';
import { useTheme } from '@/ui/theme';
import { loadProgress, type ProgressData } from './service';
import { addWeight, removeWeight, updateWeight } from './weight';

export function formatDate(key: DateKey, lang: AppLanguage): string {
  const [y, m, d] = key.split('-');
  return lang === 'de' ? `${d}.${m}.${y}` : `${m}/${d}/${y}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <Text variant="title3">{title}</Text>
      {children}
    </View>
  );
}

/** Fortschritt-Tab (/F800/ bis /F880/). */
export function ProgressScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const { space } = useTheme();
  const profile = useProfile((s) => s.profile);
  const [data, setData] = useState<ProgressData | null>(null);
  const [today] = useState(() => toDateKey(new Date()));
  const [week, setWeek] = useState(() => startOfWeek(toDateKey(new Date())));
  const [month, setMonth] = useState<[number, number]>(() => [
    new Date().getFullYear(),
    new Date().getMonth(),
  ]);
  const [detail, setDetail] = useState<SessionRecord | null>(null);
  const [editor, setEditor] = useState<{ entry: WeightEntry | null } | null>(null);
  const [exportError, setExportError] = useState(false);

  const reload = useCallback(() => setData(loadProgress(getRepositories(), profile)), [profile]);
  useFocusEffect(reload);

  if (!data) return <Screen>{null}</Screen>;

  const consent = !!profile?.einwilligungGesundheitsdaten;
  const system = profile?.einheitensystem ?? 'metrisch';
  const weekdays = t('progress.weekdays', { returnObjects: true }) as string[];
  const months = t('progress.months', { returnObjects: true }) as string[];
  const bars = weekMinutes(data.sessions, week);
  const todayIndex = Array.from({ length: 7 }, (_, i) => addDays(week, i)).indexOf(today);
  const trained = new Set(data.trainingDays);
  const series = weightSeries(data.weights);
  const fmtWeight = (kg: number) => {
    const w = displayWeight(kg, system);
    return `${String(w.value).replace('.', lang === 'de' ? ',' : '.')} ${w.unit}`;
  };

  const exportCsv = async () => {
    try {
      const file = new File(Paths.cache, `pilates-export-${today}.csv`);
      if (file.exists) file.delete();
      file.create();
      await file.write(buildCsv(data.sessions, data.weights));
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: t('progress.export'),
        UTI: 'public.comma-separated-values-text',
      });
    } catch (e) {
      console.warn('[Export] CSV fehlgeschlagen', e);
      setExportError(true);
    }
  };

  return (
    <Screen scroll>
      <Text variant="title1">{t('progress.title')}</Text>

      <View style={{ flexDirection: 'row', gap: space.lg }}>
        <StatTile value={String(data.totals.workouts)} label={t('progress.workouts')} />
        <StatTile value={String(data.totals.minutes)} label={t('progress.minutes')} />
        <StatTile
          value={(data.totals.kcalEstimated ? '~' : '') + data.totals.kcal}
          label={t('progress.kcal')}
        />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <StatTile large value={String(data.streak)} label={t('progress.streak')} />
          <StatTile large value={String(data.bestStreak)} label={t('progress.bestStreak')} />
        </View>
        <Text variant="caption" tone="muted">
          {t('progress.streakHint')}
        </Text>
      </Card>

      <Section title={t('progress.week')}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton
            icon="chevronLeft"
            label={t('progress.prevWeek')}
            onPress={() => setWeek(addDays(week, -7))}
          />
          <Text variant="caption" tone="muted" align="center" style={{ flex: 1 }}>
            {`${formatDate(week, lang)} – ${formatDate(addDays(week, 6), lang)}`}
          </Text>
          <IconButton
            icon="chevronRight"
            label={t('progress.nextWeek')}
            disabled={addDays(week, 7) > today}
            onPress={() => setWeek(addDays(week, 7))}
          />
        </View>
        <BarChart
          values={bars}
          labels={weekdays}
          highlightIndex={todayIndex >= 0 ? todayIndex : undefined}
          accessibilityLabel={t('progress.weekLabel', {
            values: bars.map((m, i) => `${weekdays[i]} ${m}`).join(', '),
          })}
        />
        <Text variant="caption" tone="muted">
          {t('progress.weekTotal', { count: bars.reduce((a, b) => a + b, 0) })}
        </Text>
      </Section>

      <Section title={t('progress.calendar')}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton
            icon="chevronLeft"
            label={t('progress.prevMonth')}
            onPress={() => setMonth(shiftMonth(month[0], month[1], -1))}
          />
          <Text variant="bodyStrong" align="center" style={{ flex: 1 }}>
            {`${months[month[1]]} ${month[0]}`}
          </Text>
          <IconButton
            icon="chevronRight"
            label={t('progress.nextMonth')}
            onPress={() => setMonth(shiftMonth(month[0], month[1], 1))}
          />
        </View>
        <Calendar
          rows={monthGrid(month[0], month[1])}
          weekdays={weekdays}
          trained={trained}
          today={today}
          lang={lang}
        />
      </Section>

      <Section title={t('progress.weight')}>
        {!consent ? (
          <Text tone="muted">{t('progress.weightNoConsent')}</Text>
        ) : (
          <>
            {series.length > 0 ? (
              <>
                <Text variant="display" tone="accent">
                  {fmtWeight(series[series.length - 1].gewichtKg)}
                </Text>
                <LineChart
                  values={series.map((w) => displayWeight(w.gewichtKg, system).value)}
                  startLabel={formatDate(series[0].datum, lang)}
                  endLabel={formatDate(series[series.length - 1].datum, lang)}
                  accessibilityLabel={t('progress.weightChart', {
                    values: series.map((w) => fmtWeight(w.gewichtKg)).join(', '),
                  })}
                />
              </>
            ) : (
              <Text tone="muted">{t('progress.weightEmpty')}</Text>
            )}
            {data.bmi ? (
              <Card>
                <Text variant="caption" tone="muted">
                  {t('progress.bmi')}
                </Text>
                <Text variant="title2">
                  {`${String(data.bmi.value).replace('.', lang === 'de' ? ',' : '.')} · ${t(`progress.bmi_${data.bmi.category}`)}`}
                </Text>
                <Text variant="caption" tone="muted">
                  {t('progress.bmiHint')}
                </Text>
              </Card>
            ) : (
              <Text variant="caption" tone="muted">
                {t('progress.bmiMissing')}
              </Text>
            )}
            <Button
              title={t('progress.addWeight')}
              variant="secondary"
              onPress={() => setEditor({ entry: null })}
            />
            <View>
              {[...data.weights].reverse().map((w) => (
                <ListItem
                  key={w.id}
                  title={fmtWeight(w.gewichtKg)}
                  subtitle={formatDate(w.datum, lang)}
                  rightIcon="edit"
                  onPress={() => setEditor({ entry: w })}
                />
              ))}
            </View>
          </>
        )}
      </Section>

      <Section title={t('progress.history')}>
        {data.sessions.length === 0 ? (
          <Text tone="muted">{t('progress.historyEmpty')}</Text>
        ) : (
          <View>
            {data.sessions.map((s) => (
              <ListItem
                key={s.id}
                title={sessionTitle(s, t)}
                subtitle={[
                  formatDate(toDateKey(new Date(s.start)), lang),
                  t('common.min', { count: Math.max(1, Math.round(s.dauerS / 60)) }),
                  s.abgeschlossen ? null : t('progress.aborted'),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                leftIcon={s.abgeschlossen ? 'checkCircle' : 'close'}
                onPress={() => setDetail(s)}
              />
            ))}
          </View>
        )}
      </Section>

      <Button title={t('progress.export')} variant="secondary" fullWidth onPress={exportCsv} />
      <Text variant="caption" tone="muted">
        {t('progress.exportHint')}
      </Text>

      <Sheet
        visible={detail !== null}
        title={detail ? sessionTitle(detail, t) : ''}
        onClose={() => setDetail(null)}
      >
        {detail ? <SessionDetail s={detail} /> : null}
        <Button
          title={t('common.close')}
          variant="secondary"
          fullWidth
          onPress={() => setDetail(null)}
        />
      </Sheet>

      {editor ? (
        <WeightEditor
          entry={editor.entry}
          today={today}
          system={system}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            reload();
          }}
        />
      ) : null}

      <Dialog
        visible={exportError}
        title={t('progress.exportError')}
        confirmLabel={t('common.close')}
        onConfirm={() => setExportError(false)}
        onCancel={() => setExportError(false)}
      />
    </Screen>
  );
}

type TFn = ReturnType<typeof useTranslation>['t'];

function sessionTitle(s: SessionRecord, t: TFn): string {
  if (s.titel) return s.titel;
  if (s.planTagNr !== null) return t('plan.day', { n: s.planTagNr });
  return t('workout.title');
}

function SessionDetail({ s }: { s: SessionRecord }) {
  const { t } = useTranslation();
  const lang = useLang();
  const { space } = useTheme();
  const row = (label: string, value: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
      <Text tone="muted">{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
  const time = new Date(s.start);
  const hhmm = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  return (
    <View style={{ gap: space.sm }}>
      {row(t('progress.date'), `${formatDate(toDateKey(time), lang)} ${hhmm}`)}
      {row(
        t('complete.duration'),
        t('common.min', { count: Math.max(1, Math.round(s.dauerS / 60)) }),
      )}
      {row(
        t('complete.exercises'),
        `${s.uebungenErledigt} / ${s.uebungenGesamt || s.uebungenErledigt}`,
      )}
      {row(t('complete.kcal'), (s.kcalGeschaetzt ? '~' : '') + Math.round(s.kcal))}
      {row(
        t('progress.status'),
        s.abgeschlossen
          ? t('progress.completed')
          : `${t('progress.aborted')}${s.abbruchGrund ? ` (${t(`player.reason_${s.abbruchGrund}`)})` : ''}`,
      )}
      {s.feedback ? row(t('complete.feedbackTitle'), t(`complete.feedback_${s.feedback}`)) : null}
    </View>
  );
}

function WeightEditor({
  entry,
  today,
  system,
  onClose,
  onSaved,
}: {
  entry: WeightEntry | null;
  today: DateKey;
  system: 'metrisch' | 'imperial';
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const { space } = useTheme();
  const [value, setValue] = useState(
    entry ? String(displayWeight(entry.gewichtKg, system).value) : '',
  );
  const [date, setDate] = useState<DateKey>(entry?.datum ?? today);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const unit = displayWeight(1, system).unit;

  const save = () => {
    const kg = parseWeightInput(value, (v) => weightToKg(v, system));
    if (kg === null) {
      setError(t('complete.weightInvalid'));
      return;
    }
    if (entry) updateWeight(entry.id, date, kg);
    else addWeight(date, kg);
    onSaved();
  };

  return (
    <Sheet
      visible
      title={entry ? t('progress.editWeight') : t('progress.addWeight')}
      onClose={onClose}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton
          icon="chevronLeft"
          label={t('progress.dayBefore')}
          onPress={() => setDate(addDays(date, -1))}
        />
        <Text variant="bodyStrong" align="center" style={{ flex: 1 }}>
          {formatDate(date, lang)}
        </Text>
        <IconButton
          icon="chevronRight"
          label={t('progress.dayAfter')}
          disabled={date >= today}
          onPress={() => setDate(addDays(date, 1))}
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <TextField
          label={t('complete.weightLabel')}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          suffix={unit}
          error={error}
        />
      </View>
      <View style={{ gap: space.sm }}>
        <Button title={t('common.save')} fullWidth onPress={save} />
        {entry ? (
          <Button
            title={t('common.delete')}
            variant="danger"
            fullWidth
            onPress={() => setConfirmDelete(true)}
          />
        ) : null}
        <Button title={t('common.cancel')} variant="ghost" fullWidth onPress={onClose} />
      </View>
      <Dialog
        visible={confirmDelete}
        title={t('progress.deleteWeightTitle')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          if (entry) removeWeight(entry.id);
          setConfirmDelete(false);
          onSaved();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Sheet>
  );
}

function Calendar({
  rows,
  weekdays,
  trained,
  today,
  lang,
}: {
  rows: (DateKey | null)[][];
  weekdays: string[];
  trained: ReadonlySet<DateKey>;
  today: DateKey;
  lang: AppLanguage;
}) {
  const { t } = useTranslation();
  const { colors, space, radius, borderWidth, touchMin } = useTheme();
  const cell = touchMin - space.md;
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((d) => (
          <Text key={d} variant="caption" tone="muted" align="center" style={{ flex: 1 }}>
            {d}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((day, i) => {
            if (!day) return <View key={i} style={{ flex: 1, height: cell }} />;
            const on = trained.has(day);
            const isToday = day === today;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Pressable
                  accessible
                  accessibilityLabel={`${formatDate(day, lang)}${on ? `, ${t('progress.trained')}` : ''}`}
                  style={{
                    width: cell,
                    height: cell,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? colors.inverse : 'transparent',
                    borderWidth: isToday ? borderWidth * 2 : 0,
                    borderColor: colors.accent,
                  }}
                >
                  <Text variant="caption" tone={on ? 'onInverse' : 'text'}>
                    {dayOfMonth(day)}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
