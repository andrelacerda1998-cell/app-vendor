/**
 * Eventos de produto — sem SDK de terceiros.
 *
 * Porquê não Mixpanel/Firebase: evita mais uma dependência no bundle, mantém os
 * dados sob o RGPD da Piquet, e reaproveita o backend que já recebe tracking de
 * campanhas. Se um dia se quiser um fornecedor externo, basta acrescentar um
 * `sink` aqui — os pontos de instrumentação na app não mudam.
 *
 * Regras:
 * - NUNCA passar dados pessoais em `properties` (nome, email, telefone, morada,
 *   IBAN, NIF, coordenadas). O servidor também os rejeita, mas o filtro começa aqui.
 * - `track()` nunca lança nem espera pela rede: o técnico no terreno não pode
 *   ficar à espera de analytics, e uma falha aqui nunca pode partir um ecrã.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosInstance } from 'axios';
import { API_ROUTES } from '@/constants/ApiRoutes';
import packageInfo from '@/package.json';

/** Catálogo fechado de eventos: evita nomes divergentes espalhados pelo código. */
export const AnalyticsEvent = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_STEP_ABANDONED: 'onboarding_step_abandoned',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Pedidos
  REQUEST_VIEWED: 'request_viewed',
  REQUEST_ACCEPTED: 'request_accepted',
  REQUEST_REFUSED: 'request_refused',
  REQUEST_EXPIRED: 'request_expired',
  REQUEST_CANCELLED: 'request_cancelled',

  // Serviço
  TRAVEL_STARTED: 'travel_started',
  SERVICE_STARTED: 'service_started',
  SERVICE_COMPLETED: 'service_completed',
  CHAT_OPENED: 'chat_opened',
  NAVIGATION_OPENED: 'navigation_opened',
  CUSTOMER_CALLED: 'customer_called',

  // Conta
  PROFILE_UPDATED: 'profile_updated',
  NOTIFICATIONS_GRANTED: 'notifications_granted',
  NOTIFICATIONS_DENIED: 'notifications_denied',
  PUSH_OPENED: 'push_opened',
  SUPPORT_CONTACTED: 'support_contacted',
  PAYMENT_ERROR: 'payment_error',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

type Props = Record<string, string | number | boolean | null | undefined>;

type QueuedEvent = {
  name: AnalyticsEventName;
  properties?: Props;
  occurred_at: string;
};

/** Chaves recusadas mesmo que alguém as passe por engano. */
const BLOCKED = new Set([
  'email', 'phone', 'phone_number', 'name', 'first_name', 'last_name',
  'address', 'street_name', 'iban', 'nif', 'at_user', 'at_password',
  'password', 'token', 'latitude', 'longitude',
]);

const QUEUE_KEY = '@piquet_vendor_analytics_queue_v1';
const MAX_QUEUE = 100;
/** Envia em lote a partir daqui, ou quando `flush()` for chamado. */
const BATCH_SIZE = 10;

let queue: QueuedEvent[] = [];
let api: AxiosInstance | null = null;
let flushing = false;

/** Ligado uma vez no arranque, a partir do ApiContext. */
export const initAnalytics = (instance: AxiosInstance) => {
  api = instance;
  AsyncStorage.getItem(QUEUE_KEY)
    .then((raw) => {
      if (!raw) return;
      const stored = JSON.parse(raw) as QueuedEvent[];
      if (Array.isArray(stored)) queue = [...stored, ...queue].slice(-MAX_QUEUE);
    })
    .catch(() => { /* fila perdida não é motivo para falhar o arranque */ });
};

const persist = () => {
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
};

const sanitize = (properties?: Props): Props | undefined => {
  if (!properties) return undefined;
  const clean: Props = {};
  for (const [key, value] of Object.entries(properties)) {
    if (BLOCKED.has(key.toLowerCase())) continue;
    if (value === undefined) continue;
    clean[key] = value;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
};

/**
 * Regista um evento. Não espera pela rede e nunca lança.
 */
export const track = (name: AnalyticsEventName, properties?: Props) => {
  queue.push({
    name,
    properties: sanitize(properties),
    occurred_at: new Date().toISOString(),
  });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  persist();

  if (queue.length >= BATCH_SIZE) void flush();
};

/** Envia o que estiver em fila. Seguro chamar a qualquer momento. */
export const flush = async () => {
  if (flushing || !api || queue.length === 0) return;
  flushing = true;

  const batch = queue.slice(0, MAX_QUEUE);
  try {
    await api.post(API_ROUTES.ANALYTICS_EVENTS, {
      events: batch,
      platform: Platform.OS,
      app_version: packageInfo.version,
    });
    // Só remove o que foi mesmo aceite; eventos novos entretanto ficam.
    queue = queue.slice(batch.length);
    persist();
  } catch {
    // Sem rede: fica em fila para a próxima tentativa.
  } finally {
    flushing = false;
  }
};
