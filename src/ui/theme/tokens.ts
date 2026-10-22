export type ColorTokens = {
  background: string;
  surface: string;
  surfaceRaised: string;
  inverse: string;
  onInverse: string;
  border: string;
  text: string;
  textMuted: string;
  textDisabled: string;
  accent: string;
  onAccent: string;
  accentText: string;
  accentGradient: readonly [string, string];
  accentGlow: string | null;
  success: string;
  onSuccess: string;
  successText: string;
  danger: string;
  onDanger: string;
  /** Rot als Text auf `background` */
  dangerText: string;
  overlay: string;
};

export type TypographyVariant =
  'timer' | 'display' | 'title1' | 'title2' | 'title3' | 'body' | 'bodyStrong' | 'caption';

export type TypographyToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  tabularNums?: boolean;
  /** Obergrenze für die Skalierung mit der Systemschrift */
  maxScale: number;
};

export type SpaceScale = {
  xs: number; // 4
  sm: number; // 8
  md: number; // 12
  lg: number; // 16
  xl: number; // 24
  xxl: number; // 32
  xxxl: number; // 48
  huge: number; // 64
  screen: number; // Seitenrand
};

export type RadiusScale = { sm: number; md: number; lg: number; full: number };

/** Alles, was ein Theme unabhängig vom Farbschema festlegt. */
export type ThemeBase = {
  id: string;
  typography: Record<TypographyVariant, TypographyToken>;
  space: SpaceScale;
  radius: RadiusScale;
  borderWidth: number;
  touchMin: number;
  duration: { fast: number; normal: number };
};

/** Ein Theme = gemeinsame Basis + Farben je Farbschema. Der Typ erzwingt Vollständigkeit. */
export type ThemeDefinition = ThemeBase & {
  colors: { light: ColorTokens; dark: ColorTokens };
};

export type ColorScheme = 'light' | 'dark';

/** Das aktive Theme, wie es Komponenten über useTheme() erhalten. */
export type Theme = ThemeBase & {
  scheme: ColorScheme;
  colors: ColorTokens;
};
