/* eslint-env jest */
/**
 * Mocks globais do ambiente de testes.
 * Manter ao mínimo: só o que NÃO funciona fora de um dispositivo.
 */

// Mock oficial do AsyncStorage.
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// i18n: os testes verificam a chave, não a tradução.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'pt', changeLanguage: jest.fn() } }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  Trans: ({ children }) => children,
}));

// `expo-linear-gradient` renderiza uma View simples nos testes.
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// `@expo/vector-icons` consulta o registo de fontes nativas no construtor, que
// não existe no ambiente de teste ("loadedNativeFonts.forEach is not a function").
// Nos testes um ícone é só uma View — o que interessa é o texto à volta.
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  const icon = () => View;
  return new Proxy({}, { get: (_t, name) => (name === 'default' ? {} : icon()) });
});

// Silencia o aviso do reanimated fora do dispositivo.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'), {
  virtual: true,
});
