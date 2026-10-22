import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useSettings } from '@/state/settings';
import { Chip, ListItem, Screen, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { space } = useTheme();
  const { schema: scheme, sprache: language, setScheme, setLanguage } = useSettings();

  return (
    <Screen scroll>
      <Text variant="title1">{t('profile.title')}</Text>

      <Text variant="title3">{t('profile.scheme')}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {(['system', 'light', 'dark'] as const).map((s) => (
          <Chip
            key={s}
            label={t(`profile.scheme${s[0].toUpperCase()}${s.slice(1)}`)}
            selected={scheme === s}
            onPress={() => setScheme(s)}
          />
        ))}
      </View>

      <Text variant="title3">{t('profile.language')}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {(['system', 'de', 'en'] as const).map((l) => (
          <Chip
            key={l}
            label={t(`profile.language${l[0].toUpperCase()}${l.slice(1)}`)}
            selected={language === l}
            onPress={() => setLanguage(l)}
          />
        ))}
      </View>

      {__DEV__ ? (
        <View>
          <Text variant="title3">{t('profile.developer')}</Text>
          <ListItem
            title={t('profile.themePreview')}
            leftIcon="palette"
            onPress={() => router.push('/dev/theme-preview')}
          />
        </View>
      ) : null}
    </Screen>
  );
}
