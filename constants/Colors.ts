/**
 * Paleta da app, em dois temas.
 *
 * `Colors` é um objeto MUTÁVEL de propósito: os ecrãs importam-no e leem
 * `Colors.card` a cada render, por isso trocar o tema é reescrever as
 * propriedades deste objeto (`applyTheme`) e voltar a montar a árvore — em vez
 * de passar cores por props ou contexto a 109 ficheiros. Ver ThemeContext.
 *
 * Regra ao acrescentar um token: dá-lhe o mesmo PAPEL nos dois temas
 * ("fundo do ecrã", "texto principal") e nunca o mesmo valor literal, senão
 * há sempre um dos temas em que o texto desaparece no fundo.
 */

export type ThemePalette = {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  link: string;
  support_primary: string;
  support_secondary: string;
  gray_light: string;
  gray_medium: string;
  gray_strong: string;
  strongest: string;
  destination: string;
  bg: string;
  card: string;
  card_high: string;
  line: string;
  muted: string;
  on_brand: string;
  brand: string;
  brand_soft: string;
  danger: string;
  warning: string;
};

/** Tema escuro — o original da app (build 12). */
export const darkPalette: ThemePalette = {
  primary: '#1B1B1B',
  secondary: '#FFFFFF',

  success: '#23E69E',
  error: '#ED4949',
  link: '#4B68EE',

  support_primary: '#FABB5B',
  support_secondary: '#757575',

  gray_light: '#BBBBBB',
  gray_medium: '#858585',
  gray_strong: '#525252',

  strongest: '#000000',
  destination: '#7259FF',

  bg: '#0C0C0E',
  card: '#1A1A1D',
  card_high: '#26262B',
  line: '#2E2E33',
  muted: '#9A9AA1',
  on_brand: '#1F2430',
  brand: '#FABB5B',
  brand_soft: '#352A18',
  danger: '#FF5A5F',
  warning: '#E9A23B',
};

/**
 * Tema claro.
 *
 * Não é o escuro invertido: os verdes, vermelhos e azuis do tema escuro foram
 * escolhidos para brilhar sobre quase-preto e, sobre branco, ficam ilegíveis —
 * por isso escurecem aqui. O amarelo da marca é a exceção que se mantém, mas
 * `brand` (usado em TEXTO) escurece para um âmbar que se lê sobre branco,
 * enquanto `support_primary` (usado em FUNDOS de botão) fica igual.
 */
export const lightPalette: ThemePalette = {
  primary: '#FFFFFF',
  secondary: '#101012',

  success: '#0E9F6E',
  error: '#D92D20',
  link: '#3448D1',

  support_primary: '#FABB5B',
  support_secondary: '#6B6B72',

  gray_light: '#6B6B72',
  gray_medium: '#8A8A91',
  gray_strong: '#C7C7CC',

  strongest: '#000000',
  destination: '#5B44E0',

  bg: '#F4F4F6',
  card: '#FFFFFF',
  card_high: '#EDEDF1',
  line: '#DEDEE3',
  muted: '#6B6B72',
  on_brand: '#1F2430',
  brand: '#A96A00',
  brand_soft: '#FFF3DF',
  danger: '#D92D20',
  warning: '#B25E09',
};

/**
 * O objeto que a app inteira importa. Arranca no escuro (o tema de sempre) e
 * é reescrito por `applyTheme` — nunca substituído, para as referências já
 * importadas continuarem a apontar para ele.
 */
export const Colors: ThemePalette = { ...darkPalette };

export type ThemeName = 'light' | 'dark';

export const applyTheme = (theme: ThemeName): void => {
  Object.assign(Colors, theme === 'light' ? lightPalette : darkPalette);
};
