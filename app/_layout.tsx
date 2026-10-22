import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initData } from '@/data/init';
import { useTranslation } from '@/i18n';
import { Screen, Text } from '@/ui/components';
import { ThemeProvider, useTheme } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync();

function Shell() {
  const { scheme, colors } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      />
    </>
  );
}

function StartupError({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="title2">{t('startup.dbError')}</Text>
      <Text tone="muted">{message}</Text>
    </Screen>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    initData()
      .then(() => setDataReady(true))
      .catch((e: unknown) => {
        console.error('[Start] Datenbank-Initialisierung fehlgeschlagen', e);
        setDataError(e instanceof Error ? e.message : String(e));
      });
  }, []);

  const ready = (fontsLoaded || !!fontError) && (dataReady || dataError !== null);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>{dataError ? <StartupError message={dataError} /> : <Shell />}</ThemeProvider>
    </SafeAreaProvider>
  );
}
