import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { usePrefs, type LanguagePref } from '@/state/prefs';
import de from './de.json';
import en from './en.json';

export type AppLanguage = 'de' | 'en';

export function resolveLanguage(pref: LanguagePref): AppLanguage {
  if (pref === 'de' || pref === 'en') return pref;
  const code = getLocales()[0]?.languageCode;
  return code === 'de' ? 'de' : 'en';
}

export const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: resolveLanguage(usePrefs.getState().language),
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Sprachwechsel in den Einstellungen übernehmen
usePrefs.subscribe((state, prev) => {
  if (state.language !== prev.language) {
    void i18n.changeLanguage(resolveLanguage(state.language));
  }
});

export { useTranslation };

/** Aktuelle App-Sprache, reagiert auf Sprachwechsel. */
export function useLang(): AppLanguage {
  const { i18n: instance } = useTranslation();
  return instance.language === 'en' ? 'en' : 'de';
}
