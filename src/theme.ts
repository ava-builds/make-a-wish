import { Platform } from 'react-native';

export const colors = {
  light: '#FFF8FB',
  lightSoft: 'rgba(255, 248, 251, 0.82)',
  lightFaint: 'rgba(255, 248, 251, 0.6)',
  plum: '#4D4380',
  plumSoft: 'rgba(77, 67, 128, 0.72)',
  cream: '#FCE9DC',
  glass: 'rgba(255, 250, 252, 0.22)',
  glassStrong: 'rgba(255, 250, 252, 0.55)',
  glassLine: 'rgba(255, 250, 252, 0.5)',
  shadow: 'rgba(70, 52, 120, 0.35)',
};

export const fonts = {
  serif: 'CormorantGaramond_400Regular',
  serifMedium: 'CormorantGaramond_500Medium',
  serifItalic: 'CormorantGaramond_400Regular_Italic',
  sansLight: 'Inter_300Light',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
};

export const KINDS = ['Wish', 'Gratitude'] as const;
export type Kind = 0 | 1;

export const isWeb = Platform.OS === 'web';
