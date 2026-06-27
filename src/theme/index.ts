import { colors } from './colors';

/** Spacing scale (4pt grid) used throughout the app. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Corner radii — the web app favours soft, generous rounding. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Typography. The web pairs Playfair Display (serif, for headings/"display")
 * with Inter (sans, for body). We load those same families via expo-font.
 */
export const fonts = {
  display: 'PlayfairDisplay_700Bold',
  displayRegular: 'PlayfairDisplay_400Regular',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const typography = {
  hero: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.primaryDark },
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.primaryDark },
  h2: { fontFamily: fonts.sansBold, fontSize: 20, lineHeight: 26, color: colors.textPrimary },
  h3: { fontFamily: fonts.sansSemibold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  bodyMuted: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  label: { fontFamily: fonts.sansSemibold, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  caption: { fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 14, color: colors.textMuted },
  button: { fontFamily: fonts.sansSemibold, fontSize: 15, lineHeight: 20 },
} as const;

/** Elevation presets — soft maroon-tinted shadow from the web (`shadow-soft`). */
export const shadows = {
  soft: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: colors.chocolate,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
} as const;

export { colors };
export const theme = { colors, spacing, radius, fonts, typography, shadows };
export type Theme = typeof theme;
