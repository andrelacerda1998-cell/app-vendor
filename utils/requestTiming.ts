import { ServiceRequestedInterface } from "@/types/services";

/**
 * Janelas de resposta a pedidos.
 *
 * 120 SEGUNDOS NO IMEDIATO, e não 60. O valor estava escrito aqui a 60 por
 * paridade com a app Flutter, mas o servidor subiu para 120 em 29/09/2026
 * (`matching.vendor_response_seconds_immediate`, migração
 * `2026_09_29_180000_cento_e_vinte_segundos_e_cinco_minutos`). A app ficou a
 * dizer ao técnico que tinha METADE do tempo que tinha mesmo — e a fechar-lhe
 * o ecrã a meio da janela que o servidor ainda lhe dava.
 *
 * ATENÇÃO AO MEXER: no fluxo de MATCHING quem manda é o `expires_at` que o
 * servidor envia no convite, não este número. Estas constantes só valem para a
 * ADJUDICAÇÃO DIRETA, onde o servidor não impõe prazo nenhum (AcceptService só
 * verifica se o serviço ainda está PENDING) — aqui a janela é uma promessa da
 * app, e é por isso que tem de ser a mesma que o resto do sistema usa.
 */
export const IMMEDIATE_WINDOW_MS = 120 * 1000;
/**
 * O agendado tem HOJE o mesmo prazo do imediato -- 120 s, não 20 minutos.
 *
 * Os 20 minutos eram o mesmo erro do 60: um número escrito aqui que nunca
 * acompanhou o servidor. As definições (`vendor_response_seconds_scheduled`)
 * dizem 120, e o comentário de quem as escreveu explica porquê: *"a pergunta
 * que se faz muda (podes agora? ou podes quinta às 15h?), o tempo para
 * responder não"*. Ficam separadas para poderem voltar a divergir, e é por isso
 * que esta constante continua a existir em vez de apontar para a outra.
 */
export const SCHEDULED_WINDOW_MS = 120 * 1000;

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

/**
 * Instante (ms epoch) em que o pedido expira, ou 0 se não der para calcular.
 *
 * QUEM MANDA É O SERVIDOR. O `expires_at` que vem no payload é o mesmo
 * instante em que o `services:expirar-pedidos-pendentes` fecha o pedido — usar
 * outra conta aqui era o contador chegar a zero numa altura e o pedido morrer
 * noutra, e o técnico deslizar para nada.
 *
 * A conta local fica só para respostas antigas, de servidores que ainda não
 * mandam o campo. Foi exactamente essa conta que, com a constante nos 60, se
 * desalinhou do servidor durante meses.
 */
export const requestExpiresAt = (item?: Partial<ServiceRequestedInterface> | null): number => {
  const doServidor = Date.parse(String(item?.expires_at ?? ''));
  if (!Number.isNaN(doServidor) && doServidor > 0) return doServidor;

  const created = createdAtMs(item?.created_at);
  if (!created) return 0;
  return created + requestWindowMs(item);
};

/**
 * Quanto durou a janela INTEIRA, segundo o servidor.
 *
 * É o que a frase do topo anuncia ("tens X para aceitar"), e tem de sair do
 * mesmo sítio que o contador: anunciar um total e contar outro era a forma
 * mais rápida de parecer avariado. Só cai nas constantes quando o servidor não
 * manda `expires_at`.
 */
export const requestWindowFromServer = (
  item?: Partial<ServiceRequestedInterface> | null,
): number => {
  const fim = Date.parse(String(item?.expires_at ?? ''));
  const inicio = createdAtMs(item?.created_at);
  if (!Number.isNaN(fim) && fim > 0 && inicio > 0 && fim > inicio) return fim - inicio;

  return requestWindowMs(item);
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
