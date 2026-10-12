import { deveAnunciarServicoConfirmado } from '../servicoConfirmado';

const novo = { id: 40, status: 'Accepted', is_immediate: true };

describe('deveAnunciarServicoConfirmado', () => {
  it('avisa um serviço imediato, aceite, que aparece depois da primeira carga', () => {
    expect(deveAnunciarServicoConfirmado(novo, new Set(), true)).toBe(true);
  });

  it('não avisa antes de a primeira carga da sessão acabar', () => {
    expect(deveAnunciarServicoConfirmado(novo, new Set(), false)).toBe(false);
  });

  it('não avisa um serviço já conhecido (em curso ao abrir a app, ou aceite pelo próprio técnico)', () => {
    expect(deveAnunciarServicoConfirmado(novo, new Set(['40']), true)).toBe(false);
  });

  it('não avisa um agendado que fica ativo no dia', () => {
    expect(deveAnunciarServicoConfirmado({ id: 41, status: 'Accepted', is_immediate: false }, new Set(), true)).toBe(false);
    expect(deveAnunciarServicoConfirmado({ id: 42, status: 'Accepted', schedule_id: 7 }, new Set(), true)).toBe(false);
    expect(deveAnunciarServicoConfirmado({ id: 43, status: 'Accepted', schedule: { scheduled_day: '2026-10-13' } }, new Set(), true)).toBe(false);
  });

  it('não avisa um serviço que já não está só aceite', () => {
    expect(deveAnunciarServicoConfirmado({ ...novo, status: 'Arrived' }, new Set(), true)).toBe(false);
  });

  it('sem serviço não avisa', () => {
    expect(deveAnunciarServicoConfirmado(null, new Set(), true)).toBe(false);
    expect(deveAnunciarServicoConfirmado({ status: 'Accepted' }, new Set(), true)).toBe(false);
  });

  it('sem is_immediate, deriva do agendamento como o resto da app', () => {
    expect(deveAnunciarServicoConfirmado({ id: 44, status: 'Accepted' }, new Set(), true)).toBe(true);
  });
});
