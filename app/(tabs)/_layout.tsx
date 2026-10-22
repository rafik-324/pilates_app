import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from '@/i18n';
import { Icon, type IconName } from '@/ui/components';
import { useTheme } from '@/ui/theme';

function tabIcon(name: IconName) {
  return function TabIcon({ color }: { color: unknown }) {
    return <Icon name={name} size={24} color={color as string} />;
  };
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors, typography, borderWidth } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: borderWidth,
        },
        tabBarLabelStyle: { fontFamily: typography.caption.fontFamily },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.plan'), tabBarIcon: tabIcon('tabPlan') }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: t('tabs.discover'), tabBarIcon: tabIcon('tabDiscover') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: t('tabs.progress'), tabBarIcon: tabIcon('tabProgress') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('tabProfile') }}
      />
    </Tabs>
  );
}
