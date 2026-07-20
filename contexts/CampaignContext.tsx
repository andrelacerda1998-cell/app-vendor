import React, { createContext, useContext, useState, useCallback, useEffect, PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CampaignData {
  campaign_log_id: number;
  campaign_id: number;
  deep_link: string | null;
  timestamp: number;
}

interface CampaignContextProps {
  campaignData: CampaignData | null;
  setCampaignData: (data: CampaignData | null) => void;
  clearCampaignData: () => void;
  getCampaignLogId: () => number | null;
}

const CampaignContext = createContext<CampaignContextProps | undefined>(undefined);

const STORAGE_KEY = 'campaign_data';
const EXPIRY_MS = 48 * 60 * 60 * 1000;

export function CampaignProvider({ children }: PropsWithChildren) {
  const [campaignData, setCampaignDataState] = useState<CampaignData | null>(null);

  const clearCampaignData = useCallback(async () => {
    setCampaignDataState(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[CampaignContext] Failed to clear campaign data:', error);
    }
  }, []);

  const setCampaignData = useCallback(async (data: CampaignData | null) => {
    setCampaignDataState(data);
    if (data) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('[CampaignContext] Failed to persist campaign data:', error);
      }
    } else {
      await clearCampaignData();
    }
  }, [clearCampaignData]);

  const getCampaignLogId = useCallback(() => {
    return campaignData?.campaign_log_id ?? null;
  }, [campaignData]);

  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data: CampaignData = JSON.parse(stored);
          const age = Date.now() - data.timestamp;
          if (age > EXPIRY_MS) {
            await clearCampaignData();
          } else {
            setCampaignDataState(data);
          }
        }
      } catch (error) {
        console.error('[CampaignContext] Failed to load campaign data:', error);
      }
    };
    loadCampaignData();
  }, [clearCampaignData]);

  return (
    <CampaignContext.Provider value={{ campaignData, setCampaignData, clearCampaignData, getCampaignLogId }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}