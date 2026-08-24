import { ServiceRequestedInterface } from "@/types/services";

/**
 * Janelas de resposta a pedidos — paridade com a app Flutter (piquet_pro):
 * pedido IMEDIATO tem 60 segundos, pedido AGENDADO tem 20 minutos.
 */
export const IMMEDIATE_WINDOW_MS = 60 * 1000;
export const SCHEDULED_WINDOW_MS = 20 * 60 * 1000;

/** Segundos finais em que damos feedback háptico (vibração). */
export const URGENT_THRESHOLD_MS = 10 * 1000;

/**
 * O payload do vendor traz `is_immediate` (Service::formatDataForVendor).
 * O endpoint da lista de pendentes (ServiceRequestedData) ainda não o devolve,
 * por isso derivamos da MESMA regra do backend: imediato == sem agendamento.
 */
export const isImmediateRequest = (item?: Partial<ServiceRequestedInterface> | null): boolean => {
  if (!item) return true;
  if (typeof item.is_immediate === "boolean") return item.is_immediate;
  return !(item.schedule_id || item.schedule?.scheduled_day);
};

export const requestWindowMs = (item?: Partial<ServiceRequestedInterface> | null): number =>
  isImmediateRequest(item) ? IMMEDIATE_WINDOW_MS : SCHEDULED_WINDOW_MS;

/** `created_at` chega em segundos (created_timestamp); toleramos milissegundos. */
export const createdAtMs = (createdAt?: number | string | null): number => {
  const raw = Number(createdAt);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw < 1e12 ? raw * 1000 : raw;
};

/** Instante (ms epoch) em que o pedido expira, ou 0 se não der para calcular. */
export const requestExpiresAt = (item?: Partial<ServiceRequestedInterface> | null): number => {
  const created = createdAtMs(item?.created_at);
  if (!created) return 0;
  return created + requestWindowMs(item);
};

export type RemainingTime = { minutes: number; seconds: number };

/** Devolve null quando já expirou, undefined quando não há dados para contar. */
export const remainingFrom = (expiresAt: number, now = Date.now()): RemainingTime | null | undefined => {
  if (!expiresAt) return undefined;
  const diff = expiresAt - now;
  if (diff <= 0) return null;
  return {
    minutes: Math.floor(diff / 1000 / 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

/** Progresso restante 1 → 0, para a barra fina que esvazia. */
export const remainingProgress = (
  expiresAt: number,
  windowMs: number,
  now = Date.now(),
): number => {
  if (!expiresAt || !windowMs) return 0;
  const diff = expiresAt - now;
  if (diff <= 0) return 0;
  return Math.min(1, diff / windowMs);
};

/**
 * `distance` vem do backend em QUILÓMETROS (helpers/distance.php: fórmula de
 * Haversine com raio 6371 km, arredondada e com mínimo de 1). Não há qualquer
 * dado de tempo de viagem no payload — por isso só mostramos a distância.
 */
export const formatDistanceKm = (distance?: number | null): string | null => {
  const km = Number(distance);
  if (!Number.isFinite(km) || km <= 0) return null;
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`;
};
