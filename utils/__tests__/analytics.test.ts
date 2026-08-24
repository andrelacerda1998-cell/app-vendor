/**
 * O módulo de analytics guarda a fila em estado de módulo, por isso cada teste
 * volta a carregá-lo do zero (`jest.resetModules`) para não herdar eventos.
 *
 * Não havendo forma pública de espreitar a fila, observamo-la pelo payload que
 * o `flush()` envia — que é exatamente o contrato que interessa proteger.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

type Analytics = typeof import('@/utils/analytics');

const load = (): Analytics => {
  let mod: Analytics;
  jest.isolateModules(() => {
    mod = require('@/utils/analytics');
  });
  return mod!;
};

const makeApi = () => ({ post: jest.fn().mockResolvedValue({ data: { ok: true } }) });

const sentEvents = (api: ReturnType<typeof makeApi>) => api.post.mock.calls[0][1].events;

beforeEach(async () => {
  jest.resetModules();
  await AsyncStorage.clear();
});

describe('track — filtro de dados pessoais', () => {
  it('remove chaves pessoais das properties', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);

    mod.track(mod.AnalyticsEvent.REQUEST_VIEWED, {
      service_id: 10,
      email: 'a@b.pt',
      iban: 'PT50...',
      latitude: 41.15,
      longitude: -8.62,
      phone: '926866108',
      name: 'André',
      nif: '123456789',
      token: 'secret',
    });
    await mod.flush();

    const props = sentEvents(api)[0].properties;
    expect(props).toEqual({ service_id: 10 });
    expect(props).not.toHaveProperty('email');
    expect(props).not.toHaveProperty('latitude');
    expect(props).not.toHaveProperty('iban');
  });

  it('o filtro é insensível a maiúsculas', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);

    mod.track(mod.AnalyticsEvent.PROFILE_UPDATED, { EMAIL: 'a@b.pt', Latitude: 1, field: 'bio' });
    await mod.flush();

    expect(sentEvents(api)[0].properties).toEqual({ field: 'bio' });
  });

  it('descarta properties `undefined` mas mantém `null` e `false`', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);

    mod.track(mod.AnalyticsEvent.REQUEST_ACCEPTED, { a: undefined, b: null, c: false, d: 0 });
    await mod.flush();

    expect(sentEvents(api)[0].properties).toEqual({ b: null, c: false, d: 0 });
  });

  it('sem properties utilizáveis o evento vai sem properties (não com objeto vazio)', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);

    mod.track(mod.AnalyticsEvent.CHAT_OPENED, { email: 'a@b.pt' });
    await mod.flush();

    expect(sentEvents(api)[0].properties).toBeUndefined();
  });

  it('carimba o evento com nome e timestamp ISO', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);

    mod.track(mod.AnalyticsEvent.SERVICE_STARTED);
    await mod.flush();

    const event = sentEvents(api)[0];
    expect(event.name).toBe('service_started');
    expect(event.occurred_at).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});

describe('flush', () => {
  it('não rebenta quando ainda não há api ligada', async () => {
    const mod = load();
    mod.track(mod.AnalyticsEvent.REQUEST_VIEWED, { service_id: 1 });
    await expect(mod.flush()).resolves.toBeUndefined();
  });

  it('não chama a api com a fila vazia', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);
    await mod.flush();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('envia plataforma e versão da app junto com os eventos', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);

    mod.track(mod.AnalyticsEvent.PUSH_OPENED);
    await mod.flush();

    const body = api.post.mock.calls[0][1];
    expect(body.platform).toBeDefined();
    expect(body.app_version).toBe(require('@/package.json').version);
  });

  it('limpa a fila depois de um envio aceite', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);

    mod.track(mod.AnalyticsEvent.PUSH_OPENED);
    await mod.flush();
    await mod.flush();

    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('mantém a fila quando a rede falha (reenvia à próxima)', async () => {
    const mod = load();
    const api = { post: jest.fn().mockRejectedValue(new Error('offline')) };
    mod.initAnalytics(api as any);

    mod.track(mod.AnalyticsEvent.REQUEST_REFUSED, { service_id: 3 });
    await expect(mod.flush()).resolves.toBeUndefined();

    api.post.mockResolvedValueOnce({ data: {} });
    await mod.flush();

    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post.mock.calls[1][1].events).toHaveLength(1);
  });
});

describe('fila', () => {
  it('faz auto-flush ao atingir o lote de 10 eventos', async () => {
    const mod = load();
    const api = makeApi();
    mod.initAnalytics(api as any);

    for (let i = 0; i < 10; i += 1) {
      mod.track(mod.AnalyticsEvent.REQUEST_VIEWED, { service_id: i });
    }
    await new Promise((r) => setTimeout(r, 0));

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(sentEvents(api)).toHaveLength(10);
  });

  it('nunca cresce acima do máximo de 100 — guarda os mais recentes', async () => {
    const mod = load();
    const api = { post: jest.fn().mockRejectedValue(new Error('offline')) };
    mod.initAnalytics(api as any);

    for (let i = 0; i < 250; i += 1) {
      mod.track(mod.AnalyticsEvent.REQUEST_VIEWED, { service_id: i });
    }
    await new Promise((r) => setTimeout(r, 0));

    api.post.mockResolvedValueOnce({ data: {} });
    await mod.flush();

    const events = api.post.mock.calls[api.post.mock.calls.length - 1][1].events;
    expect(events.length).toBeLessThanOrEqual(100);
    // Os que ficam são os últimos, não os primeiros.
    expect(events[events.length - 1].properties.service_id).toBe(249);
  });
});
