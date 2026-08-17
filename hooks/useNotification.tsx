import { useEffect } from 'react';
import { track, AnalyticsEvent } from '@/utils/analytics';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { useCampaign } from '@/contexts/CampaignContext';
import { API_ROUTES } from '@/constants/ApiRoutes';

interface CampaignPayload {
  campaign_log_id: number;
  deep_link: string | null;
  campaign_id: number;
  title: string;
  body: string;
  /**
   * Encaminhamento das notificações de vendor (adicionado no backend, ver
   * app/Notifications/Vendor/*): 'service' abre o serviço em curso,
   * 'request' abre a lista de pedidos.
   */
  open_type?: 'service' | 'request' | string | null;
  open_id?: number | string | null;
}

/** Rota da lista de pedidos à espera de resposta. */
const REQUESTS_ROUTE = '/(app)/(bottom-sheets)/(services)/requests';

/**
 * O canal Expo do backend (`laravel-notification-channels/expo`) faz
 * `json_encode` do `data` antes de o enviar, por isso o payload pode chegar
 * como objeto OU como string JSON. Normalizamos os dois casos.
 */
function readPayload(notification: Notifications.Notification): CampaignPayload | undefined {
  const raw = notification.request.content.data as unknown;
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as CampaignPayload;
    } catch {
      return undefined;
    }
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    // Alguns transportes embrulham outra vez o `data` numa string interna.
    if (typeof obj.body === 'string' && obj.open_type === undefined && obj.campaign_log_id === undefined) {
      try {
        const inner = JSON.parse(obj.body);
        if (inner && typeof inner === 'object') return { ...obj, ...inner } as CampaignPayload;
      } catch { /* não era JSON: segue o objeto tal como veio */ }
    }
    return obj as unknown as CampaignPayload;
  }
  return undefined;
}

export function NotificationObserverHandler() {
  const { api } = useApi();
  const { session } = useSession();
  const { setCampaignData } = useCampaign();

  useEffect(() => {
    let isMounted = true;

    async function trackCampaignOpen(campaignLogId: number) {
      if (!api || !session) return;
      try {
        await api.post(API_ROUTES.CAMPAIGN_LOG_OPEN(campaignLogId));
      } catch (error) {
        console.error('[NotificationObserver] Failed to track campaign open:', error);
      }
    }

    async function trackCampaignClick(campaignLogId: number) {
      if (!api || !session) return;
      try {
        await api.post(API_ROUTES.CAMPAIGN_LOG_CLICK(campaignLogId));
      } catch (error) {
        console.error('[NotificationObserver] Failed to track campaign click:', error);
      }
    }

    function redirect(notification: Notifications.Notification) {
      if (!isMounted) return;

      const data = readPayload(notification);
      if (!data) return;

      const { campaign_log_id, deep_link, campaign_id, open_type, open_id } = data;

      // Clique em push: só o tipo de destino, nunca o conteúdo da notificação.
      track(AnalyticsEvent.PUSH_OPENED, { open_type: open_type ?? 'campaign' });

      if (campaign_log_id) {
        trackCampaignOpen(campaign_log_id);

        if (deep_link) {
          trackCampaignClick(campaign_log_id);
          setCampaignData({
            campaign_log_id,
            campaign_id,
            deep_link,
            timestamp: Date.now(),
          });
        }
      }

      if (deep_link) {
        router.push(deep_link);
        return;
      }

      // Notificações de vendor: levam o técnico direto ao sítio certo.
      if (open_type === 'request') {
        // Com o id, abre o ecrã full-screen do pedido (countdown + aceitar/
        // recusar) — o momento dos 60 segundos não se gasta numa lista. O
        // próprio ecrã carrega os pendentes e fecha-se se o pedido já expirou.
        if (open_id) {
          router.push({
            pathname: '/(app)/(modals)/incoming-request/[serviceId]',
            params: { serviceId: String(open_id) },
          });
          return;
        }
        router.push(REQUESTS_ROUTE);
        return;
      }

      if (open_type === 'service' && open_id) {
        router.push(`/(app)/(services)/(open)/status/${open_id}`);
      }
    }

    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (!isMounted || !response?.notification) {
          return;
        }
        redirect(response?.notification);
      });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      redirect(response.notification);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [api, session, setCampaignData]);

  return null;
}

export function useNotificationObserver() {
  // This hook is kept for backwards compatibility
  // The actual observer is NotificationObserverHandler component
}