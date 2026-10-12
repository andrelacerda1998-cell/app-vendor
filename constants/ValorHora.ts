/**
 * Valor/hora do técnico — os números num sítio só.
 *
 * Estavam repetidos no registo, no ecrã "Valor/hora" e no ecrã de pagamentos,
 * e já tinham divergido: o registo e os pagamentos aceitavam a partir de 1 €
 * (a 06/10/2026 havia três técnicos reais a 1 €/h, a aparecer aos clientes
 * como "Mais barato"), e o "a maioria cobra" do registo ainda dizia 14–22 €
 * quando o do ecrã "Valor/hora" já tinha o valor medido.
 *
 * O servidor aplica os mesmos limites (Vendor::VALOR_HORA_MINIMO/MAXIMO no
 * backend) — mudar aqui obriga a mudar lá.
 */
export const VALOR_HORA_MINIMO = 8;
export const VALOR_HORA_MAXIMO = 50;

/**
 * "A maioria dos técnicos cobra MIN–MAX/h": medido em produção a 06/10/2026.
 * Valor/hora de 28 técnicos ativos (a partir dos preços da procura agendada;
 * os 3 abaixo do mínimo ficaram de fora): mediana 18 €, e 18 dos 28 (64%)
 * entre 12 € e 22 €. Voltar a medir quando a base de técnicos mudar.
 */
export const VALOR_HORA_MERCADO_MIN = 12;
export const VALOR_HORA_MERCADO_MAX = 22;

/**
 * O valor/hora como vem do servidor, em número (ou null se não houver).
 *
 * O backend formata-o com `number_format(..., 2, '.', ',')`: ponto decimal e
 * VÍRGULA nos milhares. Até 999 € dá "18.00" e o `Number()` lê bem; a partir
 * de 1000 € dá "2,000.00" e o `Number()` devolve NaN — o Perfil mostrava
 * "NaN €" (técnico de teste a 2000 €/h, 08/10/2026). Tira-se a vírgula dos
 * milhares antes de converter.
 */
export const lerValorHora = (valor: unknown): number | null => {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  const n = Number(String(valor).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

/** "18,00 €" — para mostrar. */
export const formatarValorHora = (valor: number): string => `${valor.toFixed(2).replace('.', ',')} €`;

/** Mensagem de erro, ou null se o valor é aceitável. */
export const validarValorHora = (valor: unknown): 'required' | 'not_number' | 'too_low' | 'too_high' | null => {
  if (valor === null || valor === undefined || valor === '') return 'required';
  const n = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(n)) return 'not_number';
  if (n < VALOR_HORA_MINIMO) return 'too_low';
  if (n > VALOR_HORA_MAXIMO) return 'too_high';
  return null;
};

/**
 * O texto do erro para o react-hook-form (true = sem erro). Os limites vão na
 * mensagem para o técnico saber o que pode pôr.
 */
export const mensagemDoValorHora = (
  erro: ReturnType<typeof validarValorHora>,
  t: (chave: string, opcoes?: Record<string, unknown>) => string,
): string | true => {
  switch (erro) {
    case 'required': return t('general.price_rate.required');
    case 'not_number': return t('general.price_rate.must_be_number');
    case 'too_low': return t('general.price_rate.min_value', { min: VALOR_HORA_MINIMO });
    case 'too_high': return t('general.price_rate.max_value', { max: VALOR_HORA_MAXIMO });
    default: return true;
  }
};
