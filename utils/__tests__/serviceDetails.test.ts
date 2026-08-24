import {
  formatAddressExtra,
  formatCustomerNotes,
  formatEstimatedDuration,
  formatFullAddress,
  formatStreetLine,
} from '@/utils/serviceDetails';

describe('formatStreetLine', () => {
  it('mostra a rua com número', () => {
    expect(
      formatStreetLine({ street_name: 'Rua de Cedofeita', street_number: '120', city: 'Porto' } as any),
    ).toBe('Rua de Cedofeita, 120');
  });

  it('mostra só a rua quando não há número', () => {
    expect(formatStreetLine({ street_name: 'Rua de Cedofeita', city: 'Porto' } as any)).toBe(
      'Rua de Cedofeita',
    );
  });

  it('cai para a cidade quando não há rua', () => {
    expect(formatStreetLine({ city: 'Porto', postal_code: '4050-174' } as any)).toBe('Porto');
  });

  it('cai para `name` e depois para o fallback', () => {
    expect(formatStreetLine({ name: 'Praça da Liberdade' } as any)).toBe('Praça da Liberdade');
    expect(formatStreetLine({} as any, 'Lisboa, Lisboa')).toBe('Lisboa, Lisboa');
    expect(formatStreetLine(null, 'Lisboa, Lisboa')).toBe('Lisboa, Lisboa');
  });

  it('ignora campos só com espaços', () => {
    expect(formatStreetLine({ street_name: '  ', city: 'Porto' } as any)).toBe('Porto');
  });

  it('devolve null quando não há nada', () => {
    expect(formatStreetLine(null, null)).toBeNull();
  });
});

describe('formatFullAddress', () => {
  it('junta rua + número e código postal + cidade', () => {
    expect(
      formatFullAddress({
        street_name: 'Rua de Cedofeita',
        street_number: '120',
        postal_code: '4050-174',
        city: 'Porto',
      } as any),
    ).toBe('Rua de Cedofeita, 120 · 4050-174 Porto');
  });

  it('omite o número quando não existe', () => {
    expect(
      formatFullAddress({ street_name: 'Rua de Cedofeita', postal_code: '4050-174', city: 'Porto' } as any),
    ).toBe('Rua de Cedofeita · 4050-174 Porto');
  });

  it('funciona só com rua', () => {
    expect(formatFullAddress({ street_name: 'Rua de Cedofeita' } as any)).toBe('Rua de Cedofeita');
  });

  it('cai para `name` quando não há partes utilizáveis', () => {
    expect(formatFullAddress({ name: 'Praça da Liberdade, Porto' } as any)).toBe(
      'Praça da Liberdade, Porto',
    );
  });

  it('cai para o fallback quando o detalhe está vazio', () => {
    expect(formatFullAddress({} as any, 'Porto')).toBe('Porto');
    expect(formatFullAddress(null, 'Porto')).toBe('Porto');
  });

  it('devolve null quando não há nada — o ecrã omite o elemento', () => {
    expect(formatFullAddress(null, null)).toBeNull();
    expect(formatFullAddress(null, '   ')).toBeNull();
  });

  it('ignora campos só com espaços', () => {
    expect(formatFullAddress({ street_name: '  ', city: 'Porto' } as any)).toBe('Porto');
  });
});

describe('formatAddressExtra', () => {
  it('devolve o complemento quando existe', () => {
    expect(formatAddressExtra({ additional_info: '3.º Esq.' } as any)).toBe('3.º Esq.');
  });

  it('devolve null quando não existe ou está vazio', () => {
    expect(formatAddressExtra(null)).toBeNull();
    expect(formatAddressExtra({} as any)).toBeNull();
    expect(formatAddressExtra({ additional_info: '  ' } as any)).toBeNull();
  });
});

describe('formatEstimatedDuration', () => {
  it('mostra minutos abaixo de 1 h', () => {
    expect(formatEstimatedDuration(45)).toBe('~45 min');
    expect(formatEstimatedDuration(59)).toBe('~59 min');
  });

  it('mostra horas redondas sem minutos', () => {
    expect(formatEstimatedDuration(60)).toBe('~1h');
    expect(formatEstimatedDuration(120)).toBe('~2h');
  });

  it('mostra horas + minutos com zero à esquerda', () => {
    expect(formatEstimatedDuration(90)).toBe('~1h30');
    expect(formatEstimatedDuration(65)).toBe('~1h05');
  });

  it('aceita string do payload', () => {
    expect(formatEstimatedDuration('90')).toBe('~1h30');
  });

  it('devolve null para valores em falta ou absurdos', () => {
    expect(formatEstimatedDuration(null)).toBeNull();
    expect(formatEstimatedDuration(undefined)).toBeNull();
    expect(formatEstimatedDuration('')).toBeNull();
    expect(formatEstimatedDuration(0)).toBeNull();
    expect(formatEstimatedDuration(-30)).toBeNull();
    expect(formatEstimatedDuration('abc')).toBeNull();
  });
});

describe('formatCustomerNotes', () => {
  it('colapsa whitespace e quebras de linha', () => {
    expect(formatCustomerNotes({ customer_notes: 'A torneira\n\n  pinga   muito' } as any)).toBe(
      'A torneira pinga muito',
    );
  });

  it('devolve null quando não há observações', () => {
    expect(formatCustomerNotes(null)).toBeNull();
    expect(formatCustomerNotes({} as any)).toBeNull();
    expect(formatCustomerNotes({ customer_notes: '   ' } as any)).toBeNull();
  });
});
