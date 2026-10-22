import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '@/state/settings';
import { DEFAULT_THEME_ID, themes } from './themes';
import type { ColorScheme, Theme } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

type Props = {
  children: React.ReactNode;
  /** Erzwingt ein Farbschema (z. B. Player: immer dunkel). */
  forceScheme?: ColorScheme;
  themeId?: string;
};

export function ThemeProvider({ children, forceScheme, themeId = DEFAULT_THEME_ID }: Props) {
  const system = useColorScheme();
  const pref = useSettings((s) => s.schema);
  const scheme: ColorScheme =
    forceScheme ?? (pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref);

  const theme = useMemo<Theme>(() => {
    const def = themes[themeId] ?? themes[DEFAULT_THEME_ID];
    const { colors, ...base } = def;
    return { ...base, scheme, colors: colors[scheme] };
  }, [scheme, themeId]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme muss innerhalb von ThemeProvider verwendet werden');
  return t;
}
