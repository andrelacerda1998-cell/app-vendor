import { avisoDeCancelamento, pausaAte } from '../fiabilidade';

const base = {
  cancellations_this_month: 0,
  cancellations_limit: 3,
  pause_hours: 48,
  invites_paused_until: null,
  no_shows_recent: 0,
  no_shows_window_days: 90,
};

describe('avisoDeCancelamento', () => {
  it('o primeiro cancelamento do mês não dá pausa', () => {
    expect(avisoDeCancelamento(base)).toMatchObject({ numero: 1, daPausa: false });
  });

  it('o terceiro é o que deixa sem convites', () => {
    expect(avisoDeCancelamento({ ...base, cancellations_this_month: 2 })).toMatchObject({ numero: 3, daPausa: true });
  });

  it('em pausa, cancelar outra vez diz que prolonga', () => {
    const futuro = new Date(Date.now() + 3600_000).toISOString();
    expect(avisoDeCancelamento({ ...base, cancellations_this_month: 3, invites_paused_until: futuro }))
      .toMatchObject({ numero: 4, daPausa: true, jaEmPausa: true });
  });

  it('sem resumo do servidor não inventa números', () => {
    expect(avisoDeCancelamento(null)).toBeNull();
    expect(avisoDeCancelamento(undefined)).toBeNull();
  });
});

describe('pausaAte', () => {
  it('uma pausa já acabada não conta', () => {
    expect(pausaAte({ ...base, invites_paused_until: new Date(Date.now() - 1000).toISOString() })).toBeNull();
  });

  it('devolve a data quando ainda está em pausa', () => {
    const futuro = new Date(Date.now() + 3600_000);
    expect(pausaAte({ ...base, invites_paused_until: futuro.toISOString() })?.getTime()).toBe(futuro.getTime());
  });
});
