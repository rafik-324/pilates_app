import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef } from 'react';
import type { AppLanguage } from '@/i18n';

// Platzhalter-Audio aus scripts/generate-audio.mjs (gleicher Dateiname = Austausch ohne Codeänderung)
const MUSIC = require('../../../assets/audio/music.wav');
const BEEP = require('../../../assets/audio/beep.wav');

type Options = {
  lang: AppLanguage;
  voice: string | null;
  voiceVolume: number;
  musicOn: boolean;
  musicVolume: number;
  /** Musik läuft nur, solange das Workout aktiv ist */
  active: boolean;
};

/**
 * Sprachausgabe (/F540/, /F550/), Signalton (/F520/) und Hintergrundmusik (/F560/).
 * Audio-Modus "duckOthers": fremde Musik wird leiser statt gestoppt (/F570/, /T140/).
 */
export function useAudioCues({ lang, voice, voiceVolume, musicOn, musicVolume, active }: Options) {
  const music = useRef<AudioPlayer | null>(null);
  const beep = useRef<AudioPlayer | null>(null);
  const opts = useRef({ lang, voice, voiceVolume });

  useEffect(() => {
    opts.current = { lang, voice, voiceVolume };
    if (beep.current) beep.current.volume = Math.max(0.2, voiceVolume);
  }, [lang, voice, voiceVolume]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
    }).catch(() => undefined);
    music.current = createAudioPlayer(MUSIC);
    music.current.loop = true;
    beep.current = createAudioPlayer(BEEP);
    return () => {
      void Speech.stop();
      music.current?.remove();
      beep.current?.remove();
      music.current = null;
      beep.current = null;
    };
  }, []);

  useEffect(() => {
    const m = music.current;
    if (!m) return;
    m.volume = musicVolume;
    if (musicOn && active && musicVolume > 0) m.play();
    else m.pause();
  }, [musicOn, musicVolume, active]);

  const speak = useCallback((text: string) => {
    const o = opts.current;
    if (o.voiceVolume <= 0) return;
    void Speech.stop();
    Speech.speak(text, {
      language: o.lang === 'de' ? 'de-DE' : 'en-US',
      voice: o.voice ?? undefined,
      volume: o.voiceVolume,
    });
  }, []);

  const playBeep = useCallback(() => {
    const b = beep.current;
    if (!b) return;
    void b.seekTo(0);
    b.play();
  }, []);

  return { speak, playBeep };
}
