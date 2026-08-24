import { renderMoney } from '@/utils/money';

/**
 * `renderMoney` recebe CÊNTIMOS (é o que o backend devolve) e devolve euros
 * formatados em pt-PT. O separador de milhares do pt-PT é um espaço não-quebrável
 * (U+00A0), tal como o espaço antes do "€" — por isso normalizamos antes de comparar.
 */
const norm = (v: string | false) => (v === false ? v : v.replace(/ /g, ' '));

describe('renderMoney', () => {
  it('converte cêntimos em euros', () => {
    expect(norm(renderMoney(1250))).toBe('12,50 €');
    expect(norm(renderMoney(125))).toBe('1,25 €');
  });

  it('mostra sempre duas casas decimais', () => {
    expect(norm(renderMoney(100))).toBe('1,00 €');
    expect(norm(renderMoney(1))).toBe('0,01 €');
  });

  it('formata zero como 0,00 € (e NÃO como vazio)', () => {
    expect(norm(renderMoney(0))).toBe('0,00 €');
  });

  it('devolve false quando o preço é null — o ecrã omite o elemento', () => {
    expect(renderMoney(null)).toBe(false);
  });

  it('trata valores negativos (estornos) sem rebentar', () => {
    const out = norm(renderMoney(-500)) as string;
    expect(out).toContain('5,00');
    expect(out).toMatch(/-|−/);
  });

  it('agrupa milhares (pt-PT só agrupa a partir de 5 dígitos)', () => {
    expect(norm(renderMoney(123456))).toBe('1234,56 €');
    expect(norm(renderMoney(1234567))).toBe('12 345,67 €');
  });

  it('arredonda cêntimos fracionários em vez de mostrar lixo', () => {
    expect(norm(renderMoney(1234.6))).toBe('12,35 €');
  });
});
