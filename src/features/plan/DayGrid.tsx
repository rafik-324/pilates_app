import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { Icon, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';
import type { DayView } from './service';

const COLUMNS = 6;

type Props = { days: DayView[]; onPressDay: (day: DayView) => void };

/** Raster aller Plantage (/F210/): erledigt (Haken), aktuell (Rahmen), gesperrt (Schloss), Ruhetag (Mond). */
export function DayGrid({ days, onPressDay }: Props) {
  const { t } = useTranslation();
  const { colors, space, radius, borderWidth } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs }}>
      {days.map((d) => {
        const current = d.state === 'aktuell';
        const stateLabel = d.ruhetag
          ? t('plan.stateRest')
          : d.state === 'erledigt'
            ? t('plan.stateDone')
            : d.state === 'aktuell'
              ? t('plan.stateCurrent')
              : t('plan.stateLocked');
        return (
          <View key={d.tagNr} style={{ width: `${100 / COLUMNS}%`, padding: space.xs }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('plan.day', { n: d.tagNr })}, ${stateLabel}`}
              disabled={d.state === 'gesperrt'}
              onPress={() => onPressDay(d)}
              style={{
                aspectRatio: 1,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                gap: space.xs / 2,
                backgroundColor: d.state === 'erledigt' ? colors.surfaceRaised : colors.surface,
                borderWidth: current ? borderWidth * 2 : borderWidth,
                borderColor: current ? colors.accent : colors.border,
              }}
            >
              <Text variant="caption" tone={d.state === 'gesperrt' ? 'muted' : 'text'}>
                {d.tagNr}
              </Text>
              {d.state === 'erledigt' ? (
                <Icon name="check" size={16} tone="success" />
              ) : d.ruhetag ? (
                <Icon name="moon" size={14} tone={d.state === 'gesperrt' ? 'disabled' : 'muted'} />
              ) : d.state === 'gesperrt' ? (
                <Icon name="lock" size={14} tone="disabled" />
              ) : (
                <Icon name="play" size={14} tone="accent" />
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
