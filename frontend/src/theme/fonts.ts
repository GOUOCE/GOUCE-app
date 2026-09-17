// theme/fonts.ts
// Configuração de tipografia baseada no guia M3 do projeto GOUOCE

import { MD3Type } from 'react-native-paper/lib/typescript/types';

const poppins = (weight: '400' | '500' | '600' | '700'): string => {
  const map = {
    '400': 'Poppins_400Regular',
    '500': 'Poppins_500Medium',
    '600': 'Poppins_600SemiBold',
    '700': 'Poppins_700Bold',
  };
  return map[weight];
};

const inter = (weight: '400' | '500'): string => {
  const map = {
    '400': 'Inter_400Regular',
    '500': 'Inter_500Medium',
  };
  return map[weight];
};

export const fontConfig: Record<string, MD3Type> = {
  displayLarge: {
    fontFamily: poppins('700'),
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '700',
    letterSpacing: 0,
  },
  displayMedium: {
    fontFamily: poppins('700'),
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '700',
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: poppins('700'),
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: poppins('600'),
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: poppins('600'),
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: poppins('600'),
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: poppins('600'),
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: poppins('600'),
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: poppins('600'),
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: inter('400'),
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: inter('400'),
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: inter('400'),
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: inter('500'),
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: inter('500'),
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: inter('500'),
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
};
