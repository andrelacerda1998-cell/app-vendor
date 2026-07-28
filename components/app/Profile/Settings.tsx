/**
 * DEFINIÇÕES — tudo num único ecrã: notificações (ligadas ao backend),
 * permissões (informativas), conta, sobre e terminar sessão.
 */
import { CustomText } from "@/components/CustomText";
import { Card, ListCard, SectionHeader } from '@/components/ui';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, Linking, Switch, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import packageInfo from '@/package.json';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { useSession } from '@/contexts/SessionContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import InfoSquareIcon from "@/assets/icons/info";
import PrivacyPolicy from "@/assets/icons/privacy";
import ClipNotebookIcon from "@/assets/icons/terms";
import TrashCanIcon from "@/assets/icons/delete";
import DocumentIcon from "@/assets/icons/documents";
import LogoutIcon from "@/assets/icons/logout";

type Prefs = Record<string, boolean>;

/** Chaves aceites pelo PUT do backend (não inventar outras). */
const NOTIFICATION_KEYS = ['new_requests', 'messages', 'payments', 'schedule_reminders'] as const;

const Settings = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { signOut } = useSession();

  const [prefs, setPrefs] = useState<Prefs>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.get(API_ROUTES.VENDOR_NOTIFICATION_SETTINGS)
      .then((r: any) => {
        if (mounted) setPrefs(r?.data?.data?.notification_preferences ?? {});
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Update otimista com rollback em erro.
  const toggle = async (key: string) => {
    const next = !prefs[key];
    const previous = prefs;
    setPrefs((p) => ({ ...p, [key]: next }));
    setSaving(key);
    try {
      await api.put(API_ROUTES.VENDOR_NOTIFICATION_SETTINGS, { [key]: next });
    } catch {
      setPrefs(previous);
    } finally {
      setSaving(null);
    }
  };

  const openLogOutDialog = () => {
    openDialog({
      title: t('session.logout.title'),
      subtitle: t('session.logout.subtitle'),
      successButtonText: t('session.logout.confirm'),
      cancelButtonText: t('session.logout.cancel'),
      onSuccess: () => { signOut(); },
    });
  };

  const permissions = [
    {
      key: 'location',
      icon: 'map-pin' as const,
      title: t('settings_screen.permission_items.location.title'),
      subtitle: t('settings_screen.permission_items.location.subtitle'),
    },
    {
      key: 'notifications',
      icon: 'bell' as const,
      title: t('settings_screen.permission_items.notifications.title'),
      subtitle: t('settings_screen.permission_items.notifications.subtitle'),
    },
  ];

  const accountOptions = [
    {
      key: 'documents',
      label: t('profile.settings.documents'),
      onPress: () => router.push('/(app)/(modals)/documents'),
      icon: <DocumentIcon size={20} color="#fff" />,
    },
    {
      key: 'delete_account',
      label: t('profile.settings.delete_account'),
      onPress: () => router.push('/(app)/(modals)/(profile)/delete-account'),
      icon: <TrashCanIcon size={20} />,
    },
  ];

  const aboutOptions = [
    {
      key: 'about',
      label: t('profile.settings.about'),
      onPress: () => Linking.openURL('https://piquetapp.com/#FAQ'),
      icon: <InfoSquareIcon size={24} color="#fff" color2="#000" />,
    },
    {
      key: 'privacy',
      label: t('profile.settings.privacy'),
      onPress: () => Linking.openURL('https://piquetapp.com/politica-de-privacidade-para-utilizadores/'),
      icon: <PrivacyPolicy width={24} height={24} color="#fff" />,
    },
    {
      key: 'use_terms',
      label: t('profile.settings.use_terms'),
      onPress: () => Linking.openURL('https://piquetapp.com/termos-condicoes-de-utilizacao-da-aplicacao/'),
      icon: <ClipNotebookIcon width={24} height={24} />,
    },
    {
      key: 'version',
      label: t('profile.settings.version'),
      value: packageInfo.version,
      icon: <Feather name="info" size={20} color="#fff" />,
    },
  ];

  return (
    <ScrollView
      className="flex-1 px-5"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Notificações */}
      <SectionHeader title={t('settings_screen.notifications')} />
      <Card padded={false}>
        {NOTIFICATION_KEYS.map((key, i) => (
          <View key={key}>
            {i > 0 && <View style={{ height: 1, backgroundColor: Colors.line, marginLeft: 16 }} />}
            <View className="flex-row items-center px-4" style={{ minHeight: 58 }}>
              <CustomText color="secondary" size="medium" boldness="medium" classes="flex-1 pr-4" numberOfLines={1}>
                {t(`settings_screen.items.${key}`)}
              </CustomText>
              <Switch
                value={!!prefs[key]}
                onValueChange={() => toggle(key)}
                disabled={saving === key}
                trackColor={{ false: Colors.card_high, true: Colors.brand }}
                thumbColor={Colors.secondary}
              />
            </View>
          </View>
        ))}
      </Card>

      {/* Permissões */}
      <View className="mt-7">
        <SectionHeader title={t('settings_screen.permissions')} />
        <Card padded={false}>
          {permissions.map((p, i) => (
            <View key={p.key}>
              {i > 0 && <View style={{ height: 1, backgroundColor: Colors.line, marginLeft: 64 }} />}
              <View className="flex-row items-center px-4 py-4">
                <View className="w-8 items-center mr-4">
                  <Feather name={p.icon} size={20} color={Colors.secondary} />
                </View>
                <View className="flex-1">
                  <CustomText color="secondary" size="medium" boldness="medium" numberOfLines={1}>
                    {p.title}
                  </CustomText>
                  <CustomText color="muted" size="small" classes="mt-0.5" numberOfLines={2}>
                    {p.subtitle}
                  </CustomText>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* Conta */}
      <View className="mt-7">
        <SectionHeader title={t('profile.sections.account')} />
        <ListCard items={accountOptions} />
      </View>

      {/* Sobre */}
      <View className="mt-7">
        <SectionHeader title={t('settings_screen.about')} />
        <ListCard items={aboutOptions} />
      </View>

      {/* Terminar sessão */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openLogOutDialog}
        className="flex-row items-center justify-center rounded-2xl border mt-7 p-4"
        style={{ borderColor: Colors.danger }}
      >
        <LogoutIcon size={18} color={Colors.danger} />
        <CustomText color="danger" boldness="bold" classes="ml-2">
          {t('profile.my_profile.labels.logout')}
        </CustomText>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default Settings;
