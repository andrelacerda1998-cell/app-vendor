import BackHeader from '@/components/app/BackHeader';
import { tabBarContentPadding } from '@/constants/Layout';
import { CustomText } from "@/components/CustomText";
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from "@/contexts/DialogContext";
import { useSession } from '@/contexts/SessionContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { API_ROUTES } from '@/constants/ApiRoutes';
import GearIcon from "@/assets/icons/gear-icon";
import CreditCardIcon from "@/assets/icons/credit-card";
import LogoutIcon from "@/assets/icons/logout";
import ToolIcon from "@/assets/icons/tool";
import UserAvatarIcon from "@/assets/icons/user-avatar";
import ReceiveRequestsCard from "@/components/app/Profile/ReceiveRequestsCard";
import { Card, SectionHeader, ListCard, StatusPill } from "@/components/ui";
import { useSchedule } from '@/contexts/ScheduleContext';
import { useService } from '@/contexts/ServiceContext';

interface Section {
  [key: string]: any;
}

const Profile = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { signOut, vendorData } = useSession();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { weekdays, getScheduleSettings } = useSchedule();
  const { myOperationAreas } = useService();
  const [stats, setStats] = useState<{ rating: number | null; total_services: number; acceptance_rate: number | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    api.get(API_ROUTES.VENDOR_GET_STATS)
      .then((r: any) => { if (mounted) setStats(r?.data?.data ?? null); })
      .catch(() => {});
    getScheduleSettings();
    return () => { mounted = false; };
  }, []);

  // Valores mostrados à direita de cada linha (só quando os dados existem).
  const activeServices = myOperationAreas
    ? myOperationAreas.reduce((n, a) => n + (a?.services_types_subscribed?.length || 0), 0)
    : null;
  const activeDays = weekdays?.length ? weekdays.filter((d: any) => d.enabled).length : null;
  const priceRate = vendorData?.price_rate != null ? Number(vendorData.price_rate) : null;

  // A minha atividade
  const activitySections: Section[] = [
    {
      label: t('profile.my_profile.labels.my_services'), tab: 'My Services', icon: <ToolIcon size={22} color={Colors.secondary} />,
      value: activeServices != null ? t('profile.values.services_active', { count: activeServices }) : undefined,
    },
    {
      label: t('profile.activity.price_rate'), tab: 'Price Rate', icon: <CreditCardIcon size={22} color={Colors.secondary} />,
      value: priceRate != null ? `${priceRate.toFixed(2).replace('.', ',')} €` : undefined,
    },
    {
      label: t('profile.activity.availability'), tab: 'Availability', icon: <Feather name="calendar" size={20} color={Colors.secondary} />,
      value: activeDays != null ? t('profile.values.days_active', { count: activeDays }) : undefined,
    },
    {
      label: t('profile.activity.reviews'), tab: 'Reviews', icon: <Feather name="star" size={20} color={Colors.secondary} />,
      value: stats?.rating != null ? `${stats.rating.toFixed(1)} ★` : undefined,
    },
    { label: t('profile.activity.documents'), tab: 'Documents', icon: <Feather name="file-text" size={20} color={Colors.secondary} /> },
    // Faltas: penalizações por não comparecer. Fica visível mesmo com zero —
    // saber que a regra existe é metade de não faltar.
    { label: t('profile.activity.no_shows'), tab: 'No Shows', icon: <Feather name="user-x" size={20} color={Colors.secondary} /> },
    { label: t('history.title'), tab: 'History', icon: <Feather name="clock" size={20} color={Colors.secondary} /> },
  ];

  // Conta
  const accountSections: Section[] = [
    // "O meu perfil" saiu daqui: o lápis no cabeçalho já abre a edição.
    { label: t('profile.my_profile.labels.settings'), tab: 'Settings', icon: <GearIcon size={20} color={Colors.secondary} /> },
    { label: t('profile.activity.support'), tab: 'Support', icon: <Feather name="life-buoy" size={20} color={Colors.secondary} /> },
  ];

  // Estado da conta: cartão próprio com pill de estado (verde quando aprovada).
  // "Em análise" só faz sentido depois de o técnico submeter os documentos —
  // antes disso o registo está incompleto. Dizer "em análise" com documentos
  // em falta era incoerente. Mesma leitura da página de Estado da conta.
  const approved = !!vendorData?.can_accept_service;
  const submitted = (vendorData?.pending_documents?.length ?? 0) > 0;
  const missingDocs = (vendorData?.missing_documents?.length ?? 0) > 0;
  const underReview = !approved && submitted;
  const statusColor = approved ? Colors.success : Colors.warning;
  const statusLabel = approved
    ? t('profile.status.approved')
    : underReview
      ? t('profile.status.pending')
      : missingDocs
        ? t('profile.status.missing_documents')
        : t('profile.status.incomplete');

  const handleNavigation = (tab: string) => {
    switch (tab) {
      case "Payments":
        router.navigate({ pathname: "/(app)/(pages)/(payments)/payments" });
        break;
      case "Price Rate":
        router.navigate({ pathname: "/(app)/(pages)/(hourly-rate)/hourly-rate" });
        break;
      case "Availability":
        router.navigate({ pathname: "/(app)/(bottom-sheets)/(services)/schedulesSettings" });
        break;
      case "Reviews":
        router.navigate({ pathname: "/(app)/(pages)/(reviews)/reviews" });
        break;
      case "No Shows":
        router.navigate({ pathname: "/(app)/(pages)/(no-shows)/no-shows" });
        break;
      case "Documents":
        router.navigate({ pathname: "/(app)/(pages)/(mydocuments)/mydocuments" });
        break;
      case "History":
        router.navigate({ pathname: "/(app)/(pages)/(history)/history" });
        break;
      case "Account Status":
        router.navigate({ pathname: "/(app)/(pages)/(account-status)/account-status" });
        break;
      case "Support":
        router.navigate({ pathname: "/(app)/(pages)/(support)/support" });
        break;
      case "Settings":
        router.navigate({ pathname: "/(app)/(pages)/(settings)/settings" });
        break;
      case "My Services":
        router.navigate({ pathname: "/(app)/(bottom-sheets)/areas" });
        break;
      case "City Survey":
        router.navigate('/(app)/(complete-profile)/CompleteProfile');
        break;
      case "Log out":
        openLogOutDialog();
        break;
      default:
        return;
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

  // O nome próprio vem primeiro: o `username` deixou de ser escrito pelo técnico
  // (passou a ser gerado no servidor) e mostrá-lo daria "joaoavilasa" em vez de "João".
  const name = vendorData?.user?.first_name || vendorData?.username || '';
  const city = vendorData?.user?.address?.city;
  const phone = vendorData?.user?.phone_number;
  const subtitle = [city, phone].filter(Boolean).join(' · ');
  const avatarSrc = vendorData?.user?.avatar?.src;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('profile.my_profile.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: tabBarContentPadding(insets.bottom) }}>
        {/* Cabeçalho de perfil */}
        <View className="flex-row items-center">
          <View
            className="h-16 w-16 rounded-full overflow-hidden mr-3 items-center justify-center"
            style={{ backgroundColor: Colors.support_primary }}
          >
            {avatarSrc ? (
              <Image source={{ uri: avatarSrc }} className="w-full h-full" />
            ) : name ? (
              <CustomText size="subtitle" boldness="bolder" color="on_brand">
                {name.charAt(0).toUpperCase()}
              </CustomText>
            ) : (
              <UserAvatarIcon />
            )}
          </View>
          <View className="flex-1">
            <CustomText size="large" color="secondary" boldness="bolder" numberOfLines={1}>
              {name}
            </CustomText>
            {!!subtitle && (
              <CustomText size="small" color="muted" numberOfLines={1} classes="mt-0.5">
                {subtitle}
              </CustomText>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/(modals)/(profile)/edit-profile')}
            className="w-10 h-10 rounded-full items-center justify-center border"
            style={{ backgroundColor: Colors.card,  borderColor: Colors.line }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('profile.edit.header')}
          >
            <Feather name="edit-2" size={18} color={Colors.brand} />
          </TouchableOpacity>
        </View>

        {/* Métricas (dados reais) */}
        <Card className="flex-row items-center mt-5" padded={false} style={{ paddingVertical: 18 }}>
          <View className="flex-1 items-center">
            <View className="flex-row items-center">
              <CustomText size="large" color="secondary" boldness="bolder">
                {stats?.rating != null ? stats.rating.toFixed(1) : '—'}
              </CustomText>
              <Ionicons name="star" size={14} color={Colors.brand} style={{ marginLeft: 3 }} />
            </View>
            <CustomText size="extraSmall" color="muted" classes="mt-1">{t('home_stats.rating')}</CustomText>
          </View>
          <View style={{ width: 1, height: 34, backgroundColor: Colors.line }} />
          <View className="flex-1 items-center">
            <CustomText size="large" color="secondary" boldness="bolder">
              {String(stats?.total_services ?? 0)}
            </CustomText>
            <CustomText size="extraSmall" color="muted" classes="mt-1">{t('home_stats.services')}</CustomText>
          </View>
          <View style={{ width: 1, height: 34, backgroundColor: Colors.line }} />
          <View className="flex-1 items-center">
            <CustomText size="large" color="secondary" boldness="bolder">
              {stats?.acceptance_rate != null ? `${stats.acceptance_rate}%` : '—'}
            </CustomText>
            <CustomText size="extraSmall" color="muted" classes="mt-1">{t('profile.metrics.acceptance')}</CustomText>
          </View>
        </Card>

        {/* Estado da conta */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleNavigation('Account Status')}
          className="mt-4"
        >
          <Card className="flex-row items-center">
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: `${statusColor}22` }}
            >
              <Feather name="shield" size={20} color={statusColor} />
            </View>
            <View className="flex-1 ml-3">
              <CustomText color="secondary" boldness="bold" size="medium">
                {t('account_status.title')}
              </CustomText>
              <StatusPill
                classes="mt-1.5"
                color={statusColor}
                label={statusLabel}
              />
            </View>
            <Feather name="chevron-right" size={20} color={Colors.muted} />
          </Card>
        </TouchableOpacity>

        {/* Receber pedidos de serviços */}
        <ReceiveRequestsCard />

        {/* A minha atividade */}
        <View className="mt-7">
          <SectionHeader title={t('profile.sections.activity')} />
          <ListCard
            items={activitySections.map((s: Section) => ({
              key: s.tab,
              icon: s.icon,
              label: s.label,
              value: s.value,
              onPress: () => handleNavigation(s.tab),
            }))}
          />
        </View>

        {/* Conta */}
        <View className="mt-7">
          <SectionHeader title={t('profile.sections.account')} />
          <ListCard
            items={accountSections.map((s: Section) => ({
              key: s.tab,
              icon: s.icon,
              label: s.label,
              onPress: () => handleNavigation(s.tab),
            }))}
          />
        </View>

        {/* Terminar sessão */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openLogOutDialog}
          className="flex-row items-center justify-center rounded-2xl border mt-6 p-4"
          style={{ borderColor: Colors.danger }}
        >
          <LogoutIcon size={18} color={Colors.danger} />
          <CustomText color="danger" boldness="bold" classes="ml-2">
            {t('profile.my_profile.labels.logout')}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Profile
