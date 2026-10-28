/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // A primeira renderização carrega módulos nativos sob instrumentação de cobertura.
  // No runner do CI isso pode ultrapassar os 5 segundos padrão do Jest.
  testTimeout: 30_000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'frontend/src/**/*.{ts,tsx}',
    '!frontend/src/**/*.d.ts',
    '!frontend/src/app/**/_layout.tsx',
  ],
};
