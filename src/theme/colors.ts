/**
 * iThesis color palette — mirrors the web design tokens
 * (tailwind.config.js + index.css @theme) so the mobile app shares the
 * exact maroon identity of Batangas State University TheNEU Lipa Library.
 */
export const colors = {
  // Brand maroon
  primary: '#731B2A',
  primaryDark: '#4E0F1A',
  primaryLight: '#A34B5D',
  chocolate: '#2A0C0F',

  // Blush accents
  accent: '#E9C6CC',
  accentSoft: '#F3DADF',

  // Surfaces (warm off-whites used across the web app backgrounds)
  background: '#FDF8F9',
  backgroundAlt: '#F9F2F4',
  surface: '#FFFFFF',
  surfaceMuted: '#FBF6F7',

  // Text
  textPrimary: '#2A0C0F',
  textSecondary: '#615658',
  textMuted: '#8A7C7F',
  textInverse: '#FFFFFF',

  // Borders / dividers
  border: '#ECDFE2',
  borderStrong: '#D8C3C8',

  // Status (thesis lifecycle)
  pending: '#B7791F',
  pendingBg: '#FEF3C7',
  approved: '#2F855A',
  approvedBg: '#D1FAE5',
  rejected: '#C53030',
  rejectedBg: '#FEE2E2',
  info: '#2B6CB0',
  infoBg: '#DBEAFE',

  // Misc
  overlay: 'rgba(42,12,15,0.55)',
  shadow: 'rgba(115,27,42,0.15)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type AppColors = typeof colors;
