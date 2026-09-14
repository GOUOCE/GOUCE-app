// theme/index.ts
// Agregação do tema GOUOCE para o React Native Paper

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { lightColors, darkColors } from './colors';
import { fontConfig } from './fonts';

export const theme = {
  ...MD3LightTheme,
  colors: lightColors,
  fonts: configureFonts({ config: fontConfig }),
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: darkColors,
  fonts: configureFonts({ config: fontConfig }),
};
