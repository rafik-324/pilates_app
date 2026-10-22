import { Feather } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../theme';

/** Semantische Icon-Namen. Die Zuordnung zum Icon-Set (Feather) steht nur hier. */
const glyphs = {
  play: 'play',
  pause: 'pause',
  next: 'skip-forward',
  previous: 'skip-back',
  close: 'x',
  check: 'check',
  checkCircle: 'check-circle',
  chevronRight: 'chevron-right',
  chevronLeft: 'chevron-left',
  chevronDown: 'chevron-down',
  lock: 'lock',
  heart: 'heart',
  search: 'search',
  tabPlan: 'calendar',
  tabDiscover: 'compass',
  tabProgress: 'bar-chart-2',
  tabProfile: 'user',
  clock: 'clock',
  energy: 'zap',
  list: 'list',
  plus: 'plus',
  minus: 'minus',
  settings: 'settings',
  trash: 'trash-2',
  edit: 'edit-2',
  info: 'info',
  bell: 'bell',
  share: 'share',
  volume: 'volume-2',
  music: 'music',
  skip: 'fast-forward',
  restart: 'rotate-ccw',
  moon: 'moon',
  language: 'globe',
  palette: 'droplet',
  shield: 'shield',
  award: 'award',
  repeat: 'repeat',
  wall: 'maximize',
  floor: 'minus-square',
  warning: 'alert-triangle',
} as const;

export type IconName = keyof typeof glyphs;
type Tone =
  'text' | 'muted' | 'accent' | 'success' | 'danger' | 'disabled' | 'onAccent' | 'onInverse';

type Props = { name: IconName; size?: number; tone?: Tone; color?: string };

export function Icon({ name, size = 24, tone = 'text', color }: Props) {
  const { colors } = useTheme();
  const map: Record<Tone, string> = {
    text: colors.text,
    muted: colors.textMuted,
    accent: colors.accentText,
    success: colors.successText,
    danger: colors.dangerText,
    disabled: colors.textDisabled,
    onAccent: colors.onAccent,
    onInverse: colors.onInverse,
  };
  return <Feather name={glyphs[name]} size={size} color={color ?? map[tone]} />;
}
