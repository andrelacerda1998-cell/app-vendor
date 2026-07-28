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
  it('dá 60 s ao pedido imediato', () => {
    expect(requestWindowMs({ is_immediate: true } as any)).toBe(60 * 1000);
    expect(IMMEDIATE_WINDOW_MS).toBe(60_000);
  });

  it('dá 20 min ao pedido agendado', () => {
    expect(requestWindowMs({ schedule_id: 7 } as any)).toBe(20 * 60 * 1000);
    expect(SCHEDULED_WINDOW_MS).toBe(1_200_000);
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
