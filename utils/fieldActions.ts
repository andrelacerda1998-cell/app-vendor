/**
 * Ações "fora da app" para o técnico no terreno: navegação turn-by-turn,
 * chamada e WhatsApp para o cliente.
 *
 * Nota iOS: `canOpenURL` para esquemas de terceiros exige LSApplicationQueriesSchemes,
 * por isso NÃO o usamos — tentamos abrir o esquema nativo e, se falhar, caímos no
 * URL web equivalente, que abre sempre (na app instalada ou no browser).
 */
import { Linking, Platform } from 'react-native';

export type Coords = { latitude?: number | null; longitude?: number | null };

export type NavApp = 'apple_maps' | 'google_maps' | 'waze';

const hasCoords = (c?: Coords | null): c is { latitude: number; longitude: number } =>
  !!c && c.latitude != null && c.longitude != null;

/** Abre `url`; se o esquema não estiver instalado, abre `fallback`. */
const openWithFallback = async (url: string, fallback: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(fallback);
  }
};

/** Apps de navegação oferecidas, por plataforma. Apple Maps só existe no iOS. */
export const navApps = (): NavApp[] =>
  Platform.OS === 'ios' ? ['apple_maps', 'google_maps', 'waze'] : ['google_maps', 'waze'];

/**
 * Abre a navegação turn-by-turn até à morada do serviço.
 * Sem coordenadas usa a morada em texto (o geocoding fica do lado do mapa).
 */
export const openNavigation = async (
  app: NavApp,
  coords?: Coords | null,
  addressLabel?: string | null,
) => {
  const query = hasCoords(coords)
    ? `${coords.latitude},${coords.longitude}`
    : encodeURIComponent(addressLabel ?? '');

  if (!query) return;

  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;

  switch (app) {
    case 'apple_maps':
      // `dirflg=d` = itinerário de carro.
      return openWithFallback(`maps://?daddr=${query}&dirflg=d`, googleWeb);
    case 'google_maps':
      return openWithFallback(`comgooglemaps://?daddr=${query}&directionsmode=driving`, googleWeb);
    case 'waze':
      return openWithFallback(
        hasCoords(coords)
          ? `waze://?ll=${coords.latitude},${coords.longitude}&navigate=yes`
          : `waze://?q=${query}&navigate=yes`,
        hasCoords(coords)
          ? `https://waze.com/ul?ll=${coords.latitude},${coords.longitude}&navigate=yes`
          : `https://waze.com/ul?q=${query}&navigate=yes`,
      );
  }
};

/** Só dígitos e um `+` inicial — o que os esquemas tel:/WhatsApp aceitam. */
export const normalizePhone = (phone?: string | null): string | null => {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  return digits.length >= 6 ? cleaned : null;
};

export const callPhone = async (phone?: string | null) => {
  const number = normalizePhone(phone);
  if (!number) return;
  await Linking.openURL(`tel:${number}`);
};

export const openWhatsApp = async (phone?: string | null, message?: string) => {
  const number = normalizePhone(phone)?.replace(/\D/g, '');
  if (!number) return;
  const text = message ? `&text=${encodeURIComponent(message)}` : '';
  await openWithFallback(
    `whatsapp://send?phone=${number}${text}`,
    `https://wa.me/${number}${text ? `?${text.slice(1)}` : ''}`,
  );
};
