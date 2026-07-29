import { ServiceAddressDetails, ServiceRequestedInterface } from "@/types/services";

/**
 * Formatadores dos dados que o profissional precisa de ver ANTES de aceitar
 * um pedido: onde é, quanto tempo demora, e o que o cliente escreveu.
 *
 * Regra transversal: se o payload não trouxer o campo, devolvemos `null` e o
 * ecrã omite o elemento. Nunca inventamos valores nem mostramos placeholders.
 */

const clean = (value?: string | number | null): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

/**
 * Morada completa em duas partes: "Rua X, 120" + "4000-447 Porto".
 * Cai para `address_details.name` (morada formatada pelo geocoder) e, em
 * último caso, para a morada curta que já existia (`customer.address`).
 */
export const formatFullAddress = (
  details?: ServiceAddressDetails | null,
  fallback?: string | null,
): string | null => {
  if (details) {
    const street = [clean(details.street_name), clean(details.street_number)]
      .filter(Boolean)
      .join(", ");
    const locality = [clean(details.postal_code), clean(details.city)]
      .filter(Boolean)
      .join(" ");
    const composed = [street, locality].filter(Boolean).join(" · ");

    if (composed.length) return composed;
    const name = clean(details.name);
    if (name) return name;
  }

  return clean(fallback);
};

/**
 * Uma linha curta para os cartões de lista: a RUA (e número, se existir).
 *
 * Porquê a rua e não a cidade: `address.name` que o backend devolve é
 * `"Cidade, Estado"` (ServiceRequestedData) — dizer "Lisboa" a um técnico que
 * só trabalha em Lisboa não acrescenta nada. A rua é o que ele precisa de ler
 * de relance para saber onde vai.
 *
 * Cadeia de recurso (nunca deixar a linha vazia):
 * rua [+ número] → cidade → `name` da morada → `fallback` (`customer.address`).
 */
export const formatStreetLine = (
  details?: ServiceAddressDetails | null,
  fallback?: string | null,
): string | null => {
  if (details) {
    const street = [clean(details.street_name), clean(details.street_number)]
      .filter(Boolean)
      .join(", ");
    if (street.length) return street;

    const city = clean(details.city);
    if (city) return city;

    const name = clean(details.name);
    if (name) return name;
  }

  return clean(fallback);
};

/** Complemento da morada (andar, porta, ponto de referência), se existir. */
export const formatAddressExtra = (details?: ServiceAddressDetails | null): string | null =>
  clean(details?.additional_info);

/**
 * Duração estimada a partir de `service_type.time` (minutos):
 * 45 → "~45 min", 90 → "~1h30", 120 → "~2h".
 */
export const formatEstimatedDuration = (minutes?: number | string | null): string | null => {
  if (minutes === null || minutes === undefined || minutes === "") return null;

  const total = Math.round(Number(minutes));
  if (!Number.isFinite(total) || total <= 0) return null;

  if (total < 60) return `~${total} min`;

  const hours = Math.floor(total / 60);
  const rest = total % 60;

  return rest === 0 ? `~${hours}h` : `~${hours}h${String(rest).padStart(2, "0")}`;
};

/** Observações do cliente, normalizadas (whitespace colapsado). */
export const formatCustomerNotes = (
  item?: Partial<ServiceRequestedInterface> | null,
): string | null => {
  const notes = clean(item?.customer_notes);
  return notes ? notes.replace(/\s+/g, " ") : null;
};
