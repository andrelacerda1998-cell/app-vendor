/**
 * Helpers para apresentar DURAÇÃO e GANHO de um tipo de serviço.
 *
 * IMPORTANTE (verificado no backend, 2026-07):
 * - `services_types.time` (minutos) e `services_types.starts_from` (€) EXISTEM na
 *   base de dados, mas o endpoint do vendor (`/vendor/services/operation-areas`)
 *   NÃO os devolve — só o endpoint do cliente (`/common/services/operation-areas/...`).
 * - O ganho do técnico NÃO é 75% do preço ao cliente. Em `App\Services\RateService`
 *   o valor do vendor é `(price_rate * time/60) * hour_commission + km_price * distancia`
 *   e é o preço ao CLIENTE que é derivado dele (`vendor / (1 - system_commission)`).
 *   Por isso a estimativa aqui usa a tarifa horária do próprio técnico e o tempo do
 *   serviço, sem multiplicadores de hora/distância (que dependem do pedido concreto).
 *
 * Todas as funções devolvem `null` quando não há dados — nunca inventam valores.
 */

/** Minutos -> "45 min" / "1h" / "1h 30". Devolve null se não houver duração. */
export const formatDuration = (minutes?: number | null): string | null => {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}`;
};

/** Formata euros (unidade, não cêntimos). Devolve null se não houver valor. */
export const formatEuro = (value?: number | null): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
};

/**
 * Estimativa do que o técnico recebe por um serviço: tarifa horária × duração.
 * Devolve null se faltar a tarifa ou a duração — nunca assume um valor.
 */
export const estimateVendorEarning = (
  hourRate?: number | null,
  minutes?: number | null,
): number | null => {
  const rate = Number(hourRate);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return null;

  return (rate * minutes) / 60;
};
