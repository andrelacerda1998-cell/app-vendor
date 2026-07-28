import { Linking, Platform } from 'react-native';
import {
  callPhone,
  navApps,
  normalizePhone,
  openNavigation,
  openWhatsApp,
} from '@/utils/fieldActions';

const openURL = Linking.openURL as jest.Mock;

/** Regista o URL nativo tentado; a 1.ª chamada falha para exercitar o fallback. */
const failNativeThenFallback = () => {
  openURL
    .mockImplementationOnce(() => Promise.reject(new Error('scheme not installed')))
    .mockImplementation(() => Promise.resolve(true));
};

beforeEach(() => {
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('normalizePhone', () => {
  it('aceita número com indicativo e espaços', () => {
    expect(normalizePhone('+351 926 866 108')).toBe('+351926866108');
  });

  it('limpa parênteses, traços e pontos', () => {
    expect(normalizePhone('(351) 926-866.108')).toBe('351926866108');
  });

  it('mantém o + inicial', () => {
    expect(normalizePhone('+351926866108')).toBe('+351926866108');
  });

  it('rejeita vazio / null / undefined', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });

  it('rejeita números curtos demais (menos de 6 dígitos)', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('+351')).toBeNull();
  });

  it('aceita exatamente 6 dígitos (limite)', () => {
    expect(normalizePhone('123456')).toBe('123456');
  });

  it('rejeita texto sem dígitos suficientes', () => {
    expect(normalizePhone('sem numero')).toBeNull();
  });
});

describe('navApps', () => {
  it('inclui Apple Maps no iOS', () => {
    Platform.OS = 'ios';
    expect(navApps()).toEqual(['apple_maps', 'google_maps', 'waze']);
  });

  it('exclui Apple Maps no Android', () => {
    Platform.OS = 'android';
    expect(navApps()).toEqual(['google_maps', 'waze']);
  });
});

describe('openNavigation — com coordenadas', () => {
  const coords = { latitude: 41.1579, longitude: -8.6291 };

  it('Apple Maps: esquema nativo com dirflg=d', async () => {
    await openNavigation('apple_maps', coords);
    expect(openURL).toHaveBeenCalledWith('maps://?daddr=41.1579,-8.6291&dirflg=d');
  });

  it('Google Maps: esquema nativo com directionsmode=driving', async () => {
    await openNavigation('google_maps', coords);
    expect(openURL).toHaveBeenCalledWith(
      'comgooglemaps://?daddr=41.1579,-8.6291&directionsmode=driving',
    );
  });

  it('Waze: usa ll= quando há coordenadas', async () => {
    await openNavigation('waze', coords);
    expect(openURL).toHaveBeenCalledWith('waze://?ll=41.1579,-8.6291&navigate=yes');
  });
});

describe('openNavigation — sem coordenadas (morada em texto)', () => {
  it('codifica a morada no URL', async () => {
    await openNavigation('apple_maps', null, 'Rua de Cedofeita 120, Porto');
    expect(openURL).toHaveBeenCalledWith(
      'maps://?daddr=Rua%20de%20Cedofeita%20120%2C%20Porto&dirflg=d',
    );
  });

  it('Waze cai para q= quando não há coordenadas', async () => {
    await openNavigation('waze', null, 'Porto');
    expect(openURL).toHaveBeenCalledWith('waze://?q=Porto&navigate=yes');
  });

  it('coordenadas parciais contam como ausentes', async () => {
    await openNavigation('google_maps', { latitude: 41.1579, longitude: null }, 'Porto');
    expect(openURL).toHaveBeenCalledWith('comgooglemaps://?daddr=Porto&directionsmode=driving');
  });

  it('não abre nada sem coordenadas nem morada', async () => {
    await openNavigation('google_maps', null, null);
    expect(openURL).not.toHaveBeenCalled();
  });
});

describe('openNavigation — fallback web quando a app não está instalada', () => {
  it('Apple/Google caem no Google Maps web', async () => {
    failNativeThenFallback();
    await openNavigation('google_maps', { latitude: 41.1579, longitude: -8.6291 });
    expect(openURL).toHaveBeenLastCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=41.1579,-8.6291&travelmode=driving',
    );
  });

  it('Waze cai no waze.com/ul', async () => {
    failNativeThenFallback();
    await openNavigation('waze', { latitude: 41.1579, longitude: -8.6291 });
    expect(openURL).toHaveBeenLastCalledWith(
      'https://waze.com/ul?ll=41.1579,-8.6291&navigate=yes',
    );
  });
});

describe('callPhone', () => {
  it('abre tel: com o número normalizado', async () => {
    await callPhone('+351 926 866 108');
    expect(openURL).toHaveBeenCalledWith('tel:+351926866108');
  });

  it('não abre nada com número inválido', async () => {
    await callPhone('123');
    expect(openURL).not.toHaveBeenCalled();
  });
});

describe('openWhatsApp', () => {
  it('usa só dígitos (o WhatsApp não aceita o +)', async () => {
    await openWhatsApp('+351 926 866 108');
    expect(openURL).toHaveBeenCalledWith('whatsapp://send?phone=351926866108');
  });

  it('codifica a mensagem', async () => {
    await openWhatsApp('+351926866108', 'Estou a caminho');
    expect(openURL).toHaveBeenCalledWith(
      'whatsapp://send?phone=351926866108&text=Estou%20a%20caminho',
    );
  });

  it('cai no wa.me com a mensagem em query string', async () => {
    failNativeThenFallback();
    await openWhatsApp('+351926866108', 'Olá');
    expect(openURL).toHaveBeenLastCalledWith('https://wa.me/351926866108?text=Ol%C3%A1');
  });

  it('não abre nada sem número', async () => {
    await openWhatsApp(null);
    expect(openURL).not.toHaveBeenCalled();
  });
});
