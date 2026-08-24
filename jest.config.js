/**
 * Testes com `jest-expo` (o preset que já traz o transformer do Babel/Expo,
 * os mocks dos módulos nativos e o resolver do react-native).
 *
 * Foco: LÓGICA PURA em `utils/` — é onde os bugs se escondem e onde os testes
 * são estáveis. Smoke tests de componentes só para as primitivas simples.
 */
module.exports = {
  preset: 'jest-expo',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // O código em node_modules do RN/Expo vem em ESM/Flow e TEM de ser transpilado.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|nativewind|react-native-svg|react-native-css-interop|@gorhom/.*|react-native-reanimated|react-native-keyboard-controller|@testing-library/.*))',
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}'],

  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/.expo/', '/dist/'],

  collectCoverageFrom: ['utils/**/*.{ts,tsx}', 'components/ui/**/*.tsx'],

  clearMocks: true,
};
