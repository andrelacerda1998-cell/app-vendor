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
 * Morada em duas partes: "Rua X, 120" + "Porto".
 *
 * SEM CÓDIGO POSTAL: ninguém navega por ele, e ocupava a largura que a rua
 * precisa. O que o técnico lê de relance é a rua; a localidade só serve para
 * saber de que lado da cidade fica.
 *
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
    const locality = clean(details.city);
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

/**
 * A mesma duração, mas por extenso: "1 hora", "45 minutos", "1 hora e 30 minutos".
 *
 * O "~1h" cabia na linha de ícones mas não se lia como informação -- parecia
 * mais um símbolo ao lado dos quilómetros. Num cartão que o técnico tem 60
 * segundos para decidir, o tempo que o trabalho lhe ocupa merece uma frase.
 * A forma curta fica para onde o espaço manda (o ecrã do serviço a decorrer).
 */
export const formatDurationLong = (minutes?: number | string | null): string | null => {
  if (minutes === null || minutes === undefined || minutes === "") return null;

  const total = Math.round(Number(minutes));
  if (!Number.isFinite(total) || total <= 0) return null;

  const horas = Math.floor(total / 60);
  const mins = total % 60;

  const parteHoras = horas ? `${horas} ${horas === 1 ? "hora" : "horas"}` : null;
  const parteMinutos = mins ? `${mins} ${mins === 1 ? "minuto" : "minutos"}` : null;

  return [parteHoras, parteMinutos].filter(Boolean).join(" e ");
};

/**
 * "sábado, 03 de outubro · 15:00" a partir do dia e da hora do agendamento.
 *
 * `scheduled_day` é uma DATE (YYYY-MM-DD) e `scheduled_time_start` uma TIME
 * (HH:MM:SS). A data tem de vir do DIA -- construir um `Date` só com a hora dá
 * inválido ("10:00:00" não é uma data), e um agendado aparecia como "para
 * agora". Sem dia, devolve null e o ecrã omite a linha.
 *
 * Vive aqui porque três sítios precisam da MESMA frase: o cartão do convite, o
 * cartão da Home das candidaturas à espera, e a Agenda.
 */
export const formatQuandoAgendado = (
  dia?: string | null,
  hora?: string | null,
  opcoes: { comHora?: boolean } = {},
): string | null => {
  const { comHora = true } = opcoes;
  const d0 = clean(dia);
  if (!d0) return null;

  const h = clean(hora);
  const d = new Date(`${d0}T${h ?? "00:00:00"}`);
  if (Number.isNaN(d.getTime())) return null;

  const label = d.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" });
  if (!h || !comHora) return label;

  return `${label} · ${d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
};

/** Observações do cliente, normalizadas (whitespace colapsado). */
export const formatCustomerNotes = (
  item?: Partial<ServiceRequestedInterface> | null,
): string | null => {
  const notes = clean(item?.customer_notes);
  return notes ? notes.replace(/\s+/g, " ") : null;
};

/**
 * Uma marcação é recorrente quando tem `recurrence` própria (a primeira da
 * série) ou quando o backend a marcou como tal (`is_recurring`, que também
 * cobre as ocorrências seguintes, que herdam a série sem `recurrence` própria).
 */
export const isRecurringSchedule = (
  item?: Partial<ServiceRequestedInterface> | null,
): boolean => Boolean(item?.schedule?.is_recurring || item?.schedule?.recurrence);

/**
 * Chave de tradução para a periodicidade: `schedules.recurrence.<chave>`.
 *
 * Quando a marcação é recorrente mas não sabemos a cadência (ocorrência filha,
 * que não traz `recurrence`), dizemos só "recorrente" em vez de arriscar
 * "todas as semanas" — dizer a cadência errada é pior do que não a dizer.
 */
export const recurrenceLabelKey = (
  item?: Partial<ServiceRequestedInterface> | null,
  /**
   * Versão curta ("Semanal") para as etiquetas dos cartões, onde a frase
   * inteira ("Repete todas as semanas") empurrava tudo para outra linha.
   */
  short = false,
): string | null => {
  if (!isRecurringSchedule(item)) return null;

  const prefix = short ? "short_" : "";
  const recurrence = item?.schedule?.recurrence;
  if (recurrence === "weekly" || recurrence === "biweekly" || recurrence === "monthly") {
    return `schedules.recurrence.${prefix}${recurrence}`;
  }

  return `schedules.recurrence.${prefix}generic`;
};
