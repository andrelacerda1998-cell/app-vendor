import { useEffect } from 'react';
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

      const data = notification.request.content.data as CampaignPayload | undefined;
      if (!data) return;

      const { campaign_log_id, deep_link, campaign_id } = data;

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