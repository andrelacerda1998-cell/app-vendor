import { validarValorHora, mensagemDoValorHora, VALOR_HORA_MINIMO, VALOR_HORA_MAXIMO } from '../ValorHora';

describe('valor/hora: 8 € a 50 €, em todos os ecrãs', () => {
  it('recusa 1 €, que é o que entrava pelo registo e pelos pagamentos', () => {
    expect(validarValorHora(1)).toBe('too_low');
    expect(validarValorHora('1')).toBe('too_low');
  });

  it('aceita os limites e o meio', () => {
    expect(validarValorHora(VALOR_HORA_MINIMO)).toBeNull();
    expect(validarValorHora(18)).toBeNull();
    expect(validarValorHora('17,5')).toBeNull();
    expect(validarValorHora(VALOR_HORA_MAXIMO)).toBeNull();
  });

  it('recusa acima do máximo, vazio e texto', () => {
    expect(validarValorHora(51)).toBe('too_high');
    expect(validarValorHora('')).toBe('required');
    expect(validarValorHora('barato')).toBe('not_number');
  });

  it('a mensagem leva o limite', () => {
    const t = (chave: string, opcoes?: Record<string, unknown>) => `${chave}:${JSON.stringify(opcoes ?? {})}`;
    expect(mensagemDoValorHora('too_low', t)).toContain('"min":8');
    expect(mensagemDoValorHora(null, t)).toBe(true);
  });
});
