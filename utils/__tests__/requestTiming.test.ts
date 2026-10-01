import {
  IMMEDIATE_WINDOW_MS,
  SCHEDULED_WINDOW_MS,
  createdAtMs,
  formatDistanceKm,
  isImmediateRequest,
  remainingFrom,
  remainingProgress,
  requestExpiresAt,
  requestWindowMs,
  requestWindowFromServer,
} from '@/utils/requestTiming';

describe('isImmediateRequest', () => {
  it('assume imediato quando não há item (não deixa o técnico sem contagem)', () => {
    expect(isImmediateRequest(undefined)).toBe(true);
    expect(isImmediateRequest(null)).toBe(true);
  });

  it('respeita `is_immediate` do payload do vendor', () => {
    expect(isImmediateRequest({ is_immediate: true } as any)).toBe(true);
    expect(isImmediateRequest({ is_immediate: false } as any)).toBe(false);
  });

  it('`is_immediate: false` ganha mesmo sem agendamento no payload', () => {
    expect(isImmediateRequest({ is_immediate: false } as any)).toBe(false);
  });

  it('deriva agendado a partir de schedule_id quando `is_immediate` falta', () => {
    expect(isImmediateRequest({ schedule_id: 42 } as any)).toBe(false);
  });

  it('deriva agendado a partir de schedule.scheduled_day', () => {
    expect(isImmediateRequest({ schedule: { scheduled_day: '2026-08-01' } } as any)).toBe(false);
  });

  it('sem agendamento nenhum é imediato', () => {
    expect(isImmediateRequest({ id: 1 } as any)).toBe(true);
  });
});

describe('requestWindowMs', () => {
  // 120 s, e não 60: é o que o servidor dá desde 29/09/2026
  // (`matching.vendor_response_seconds_immediate`). Este teste existe para
  // apanhar quem o volte a baixar sem mexer na definição do servidor — a app
  // estaria a prometer metade do tempo que o sistema concede.
  it('dá 120 s ao pedido imediato, como o servidor', () => {
    expect(requestWindowMs({ is_immediate: true } as any)).toBe(120 * 1000);
    expect(IMMEDIATE_WINDOW_MS).toBe(120_000);
  });

  // 120 s, como o imediato: é o que as definições do servidor dizem
  // (`vendor_response_seconds_scheduled`). Eram 20 minutos aqui -- o mesmo
  // erro do 60 noutro sítio.
  it('dá 120 s ao pedido agendado, como o servidor', () => {
    expect(requestWindowMs({ schedule_id: 7 } as any)).toBe(120 * 1000);
    expect(SCHEDULED_WINDOW_MS).toBe(120_000);
  });
});

describe('createdAtMs', () => {
  it('converte segundos (created_timestamp) em milissegundos', () => {
    expect(createdAtMs(1_700_000_000)).toBe(1_700_000_000_000);
  });

  it('deixa passar valores que já vêm em milissegundos', () => {
    expect(createdAtMs(1_700_000_000_000)).toBe(1_700_000_000_000);
  });

  it('aceita string numérica', () => {
    expect(createdAtMs('1700000000')).toBe(1_700_000_000_000);
  });

  it('devolve 0 para valores inválidos', () => {
    expect(createdAtMs(null)).toBe(0);
    expect(createdAtMs(undefined)).toBe(0);
    expect(createdAtMs(0)).toBe(0);
    expect(createdAtMs(-5)).toBe(0);
    expect(createdAtMs('abc')).toBe(0);
  });
});

describe('requestExpiresAt', () => {
  it('soma a janela imediata ao created_at', () => {
    const created = 1_700_000_000; // segundos
    expect(requestExpiresAt({ created_at: created, is_immediate: true } as any)).toBe(
      created * 1000 + IMMEDIATE_WINDOW_MS,
    );
  });

  it('soma a janela agendada ao created_at', () => {
    const created = 1_700_000_000;
    expect(requestExpiresAt({ created_at: created, schedule_id: 3 } as any)).toBe(
      created * 1000 + SCHEDULED_WINDOW_MS,
    );
  });

  it('devolve 0 quando não há created_at para contar', () => {
    expect(requestExpiresAt({ is_immediate: true } as any)).toBe(0);
  });
});

describe('remainingFrom', () => {
  const now = 1_700_000_000_000;

  it('devolve undefined sem expiração — não há dados para contar', () => {
    expect(remainingFrom(0, now)).toBeUndefined();
  });

  it('devolve null quando já expirou', () => {
    expect(remainingFrom(now - 1, now)).toBeNull();
    expect(remainingFrom(now, now)).toBeNull(); // limite exato conta como expirado
  });

  it('reparte o tempo em minutos e segundos', () => {
    expect(remainingFrom(now + 90_000, now)).toEqual({ minutes: 1, seconds: 30 });
    expect(remainingFrom(now + 59_000, now)).toEqual({ minutes: 0, seconds: 59 });
    expect(remainingFrom(now + 20 * 60_000, now)).toEqual({ minutes: 20, seconds: 0 });
  });
});

describe('remainingProgress', () => {
  const now = 1_700_000_000_000;

  it('vai de 1 (cheio) a 0 (vazio)', () => {
    expect(remainingProgress(now + 60_000, 60_000, now)).toBe(1);
    expect(remainingProgress(now + 30_000, 60_000, now)).toBe(0.5);
    expect(remainingProgress(now, 60_000, now)).toBe(0);
  });

  it('nunca passa de 1, mesmo com relógios dessincronizados', () => {
    expect(remainingProgress(now + 999_000, 60_000, now)).toBe(1);
  });

  it('devolve 0 com dados em falta em vez de NaN', () => {
    expect(remainingProgress(0, 60_000, now)).toBe(0);
    expect(remainingProgress(now + 1000, 0, now)).toBe(0);
  });
});

describe('formatDistanceKm', () => {
  it('mostra inteiros sem casas decimais', () => {
    expect(formatDistanceKm(5)).toBe('5 km');
  });

  it('mostra uma casa decimal quando há fração', () => {
    expect(formatDistanceKm(2.5)).toBe('2.5 km');
    expect(formatDistanceKm(2.46)).toBe('2.5 km');
  });

  it('devolve null quando não há distância utilizável', () => {
    expect(formatDistanceKm(null)).toBeNull();
    expect(formatDistanceKm(undefined)).toBeNull();
    expect(formatDistanceKm(0)).toBeNull();
    expect(formatDistanceKm(-3)).toBeNull();
    expect(formatDistanceKm(Number.NaN)).toBeNull();
  });
});


/**
 * Quem manda no prazo é o SERVIDOR.
 *
 * A app calculou-o sozinha durante meses e ficou nos 60 s quando o servidor
 * subiu para 120 — e depois nos 20 minutos para os agendados quando o servidor
 * já dizia 120 s. Estes testes existem para que a próxima vez que os dois
 * divirjam seja um teste vermelho, e não um técnico a perder um pedido.
 */
describe('o prazo vem do servidor', () => {
  it('usa `expires_at` em vez da conta local', () => {
    const criado = Date.UTC(2026, 9, 1, 10, 0, 0);
    const expira = Date.UTC(2026, 9, 1, 10, 30, 0); // meia hora, nada a ver com as constantes

    const prazo = requestExpiresAt({
      created_at: Math.floor(criado / 1000),
      expires_at: new Date(expira).toISOString(),
      is_immediate: true,
    } as any);

    expect(prazo).toBe(expira);
  });

  it('cai na conta local quando o servidor não manda `expires_at`', () => {
    const criado = Date.UTC(2026, 9, 1, 10, 0, 0);

    const prazo = requestExpiresAt({
      created_at: Math.floor(criado / 1000),
      is_immediate: true,
    } as any);

    expect(prazo).toBe(criado + IMMEDIATE_WINDOW_MS);
  });

  it('ignora um `expires_at` inválido em vez de rebentar o contador', () => {
    const criado = Date.UTC(2026, 9, 1, 10, 0, 0);

    const prazo = requestExpiresAt({
      created_at: Math.floor(criado / 1000),
      expires_at: 'nao-e-uma-data',
      is_immediate: true,
    } as any);

    expect(prazo).toBe(criado + IMMEDIATE_WINDOW_MS);
  });

  it('a janela anunciada é a do servidor, não a constante', () => {
    const criado = Date.UTC(2026, 9, 1, 10, 0, 0);

    expect(
      requestWindowFromServer({
        created_at: Math.floor(criado / 1000),
        expires_at: new Date(criado + 300_000).toISOString(),
        is_immediate: true,
      } as any),
    ).toBe(300_000);
  });

  /**
   * O agendado tem o MESMO prazo do imediato. Eram 20 minutos aqui enquanto o
   * servidor dizia 120 segundos.
   */
  it('o agendado está alinhado com o imediato', () => {
    expect(SCHEDULED_WINDOW_MS).toBe(IMMEDIATE_WINDOW_MS);
    expect(SCHEDULED_WINDOW_MS).toBe(120_000);
  });
});
