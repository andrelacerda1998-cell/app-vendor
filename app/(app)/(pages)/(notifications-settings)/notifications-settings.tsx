/**
 * NOTIFICAÇÕES — o técnico escolhe que notificações quer receber.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';

type Prefs = Record<string, boolean>;

const KEYS = ['new_requests', 'schedule_reminders', 'messages', 'payments', 'news'] as const;

const NotificationSettings = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const [prefs, setPrefs] = useState<Prefs>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get(API_ROUTES.VENDOR_NOTIFICATION_SETTINGS)
      .then((r: any) => setPrefs(r?.data?.data?.notification_preferences ?? {}))
      .catch(() => {});
  }, []);

  const toggle = async (key: string) => {
    const next = !prefs[key];
    const previous = prefs;
    setPrefs((p) => ({ ...p, [key]: next }));
    setSaving(key);
    try {
      await api.put(API_ROUTES.VENDOR_NOTIFICATION_SETTINGS, { [key]: next });
    } catch {
      setPrefs(previous); // reverte em erro
    } finally {
      setSaving(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('notification_settings.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <CustomText size="small" color="muted" classes="mb-4">
          {t('notification_settings.subtitle')}
        </CustomText>

        <View style={{ gap: 10 }}>
          {KEYS.map((key) => (
            <View
              key={key}
              className="flex-row items-center bg-card border rounded-2xl p-4"
              style={{ borderColor: Colors.line }}
            >
              <View className="flex-1 pr-4">
                <CustomText color="secondary" boldness="semiBold" size="medium">
                  {t(`notification_settings.items.${key}.title`)}
                </CustomText>
                <CustomText color="muted" size="small" classes="mt-0.5" numberOfLines={2}>
                  {t(`notification_settings.items.${key}.subtitle`)}
                </CustomText>
              </View>
              <Switch
                value={!!prefs[key]}
                onValueChange={() => toggle(key)}
                disabled={saving === key}
                trackColor={{ false: Colors.card_high, true: Colors.brand }}
                thumbColor={Colors.secondary}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettings;
