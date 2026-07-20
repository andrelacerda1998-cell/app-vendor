import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { API_ROUTES } from '@/constants/ApiRoutes';

export async function optOutCampaign(campaignId: number | null): Promise<void> {
  const { api } = useApi();
  const { session } = useSession();

  if (!api || !session) {
    console.warn('[Campaign] Cannot opt out: not authenticated');
    return;
  }

  try {
    await api.post(API_ROUTES.CAMPAIGN_OPT_OUT, {
      campaign_id: campaignId,
    });
  } catch (error) {
    console.error('[Campaign] Failed to opt out:', error);
    throw error;
  }
}

export async function optInCampaign(campaignId: number | null): Promise<void> {
  const { api } = useApi();
  const { session } = useSession();

  if (!api || !session) {
    console.warn('[Campaign] Cannot opt in: not authenticated');
    return;
  }

  try {
    await api.delete(API_ROUTES.CAMPAIGN_OPT_OUT, {
      data: {
        campaign_id: campaignId,
      },
    });
  } catch (error) {
    console.error('[Campaign] Failed to opt in:', error);
    throw error;
  }
}