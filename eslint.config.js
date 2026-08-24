// Flat config (ESLint 9+). Substitui o antigo `.eslintrc.js`.
//
// `eslint-config-expo@8` ainda é eslintrc-style, por isso é carregado através do
// FlatCompat (que vem com o próprio ESLint). Traz de uma vez os plugins que
// interessam a um projeto Expo/RN: react, react-hooks, import, TypeScript.
//
// Filosofia: rede de segurança, não polícia de estilo. Erros a sério ficam a
// `error`; tudo o que for cosmético fica a `warn` para não bloquear ninguém.
// Globals do runtime React Native (Hermes + polyfills do RN). Declarados à mão em
// vez do pacote `globals`: a versão hoisted no projeto é antiga (sem `es2021`) e
// tem chaves com espaço à direita, que o ESLint 9 rejeita.
const RN_GLOBALS = {
  __DEV__: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  requestIdleCallback: 'readonly',
  cancelIdleCallback: 'readonly',
  fetch: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  FormData: 'readonly',
  Blob: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  WebSocket: 'readonly',
  XMLHttpRequest: 'readonly',
  Event: 'readonly',
  EventTarget: 'readonly',
  performance: 'readonly',
  navigator: 'readonly',
  alert: 'readonly',
  atob: 'readonly',
  btoa: 'readonly',
  structuredClone: 'readonly',
  queueMicrotask: 'readonly',
  // Presentes no alvo web (react-native-web / expo web).
  window: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  location: 'readonly',
  ErrorUtils: 'readonly',
  HermesInternal: 'readonly',
  JSX: 'readonly',
  process: 'readonly',
  require: 'readonly',
  module: 'writable',
  global: 'readonly',
};
const { FlatCompat } = require('@eslint/eslintrc');

// Em flat config, um objeto que usa `plugin/regra` tem de declarar o plugin nele
// próprio.
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

// Resolve os plugins a partir da RAIZ (não do node_modules do eslint-config-expo):
// o `eslint-plugin-react-hooks@4` que vem embutido usa APIs removidas no ESLint 9
// (`context.getSource`) e rebenta a meio do lint. A raiz tem a v5, compatível.
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'android/**',
      'ios/**',
      'patches/**',
      'coverage/**',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
    ],
  },

  ...compat.extends('expo'),

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooksPlugin },
    languageOptions: {
      // O runtime do React Native expõe os globals do browser (timers, console,
      // fetch, URL...). Sem isto o `no-undef` acusa `setTimeout` e afins e o sinal
      // útil desaparece no meio do ruído.
      globals: RN_GLOBALS,
    },
    rules: {
      // --- Bugs a sério ---
      'react-hooks/rules-of-hooks': 'error',
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-const-assign': 'error',
      'no-cond-assign': 'error',

      // --- Sinais úteis, mas que não devem parar o trabalho ---
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'import/no-unresolved': 'off', // aliases `@/` são resolvidos pelo babel/metro
    },
  },

  {
    // Ficheiros de config e scripts correm em Node (CommonJS).
    files: ['*.config.js', '*.config.ts', 'scripts/**', 'plugins/**', 'index.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', module: 'writable', require: 'readonly', process: 'readonly' },
    },
  },

  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}', 'jest.setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
];
