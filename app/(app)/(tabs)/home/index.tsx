import UserHeader from '@/components/app/UserHeader';
import { tabBarContentPadding } from '@/constants/Layout';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import {AntDesign, Entypo, Feather, Ionicons} from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, ScrollView, Animated, TouchableOpacity, Platform } from 'react-native';
import { FlatList, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '@/components/CustomText';
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import DocumentsValidating from "@/components/DocumentsValidating";
import { useService } from "@/contexts/ServiceContext";
import OpenService from "@/components/services/OpenService";


import Schedules from "@/components/app/Home/Schedules";
import {useSession} from "@/contexts/SessionContext";
import { useTranslation } from "react-i18next";
import XIcon from "@/assets/icons/x";
import { useDialog } from "@/contexts/DialogContext";
import {useLocation} from "@/contexts/LocationContext";
import {getDeviceId} from "@/utils";
import { ServiceStatus } from "@/types/services";
import CompleteYourProfile from "@/components/CompleteYourProfile";
import GeolocationPermissionBanner from "@/components/warnings/GeolocationPermissionBanner";
import AttentionIcon from "@/assets/icons/attention";
import WeekStats from "@/components/app/Home/WeekStats";
import PendingRequestsCard from "@/components/app/Home/PendingRequestsCard";
import HomeShortcuts from "@/components/app/Home/HomeShortcuts";
import AutoAcceptCard from "@/components/app/Home/AutoAcceptCard";
import NotificationsDisabledBanner from "@/components/NotificationsDisabledBanner";
import DocumentExpiryBanner from "@/components/DocumentExpiryBanner";
import { useDepartureReminders } from "@/hooks/useDepartureReminders";

const Home = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData, vendorStatus, setVendorStatus, getWalletInfo, wallet, isLoadingUserData, session } = useSession();
  const { getOperationAreas, myOperationAreas, openService, pendingService, setActiveService, activeService } = useService();
  const { openDialog } = useDialog();
  const params = useLocalSearchParams();
  // const [wallet, setWallet] = useState<WalletInterface | null>(null);
  const [isLoading, setIsLoading] = useState({
    wallet: false,
    operationAreas: false,
    vendorStatus: false
  });
  const toggleAnimation = useRef(new Animated.Value(vendorStatus === 'Online' ? 1 : 0)).current;
  const [disableStatusVendor, setDisableStatusVendor] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const { startTracking, stopTracking, isTracking, locationPermission, permissionsChecked, requestPermissions } = useLocation();

  // Agenda o aviso "está na hora de sair" (30 min antes de cada serviço).
  useDepartureReminders();

  const handleRequestGeolocationPermission = async () => {
    setGeoLoading(true);
    try {
      // requestPermissions already shows a persistent dialog (Agora não / Abrir Definições) on denial.
      await requestPermissions();
    } finally {
      setGeoLoading(false);
    }
  };

  useEffect(() => {
    Animated.timing(toggleAnimation, {
      toValue: vendorStatus === 'Online' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [vendorStatus]);

  useEffect(() => {
    setIsLoading((prev) => ({ ...prev, wallet: true }));
    getWalletInfo().finally(() => {
      setIsLoading((prev) => ({ ...prev, wallet: false }));
    });
    handleOperationAreas();
    getVendorStatus();
  }, [vendorData]);

  useEffect(() => {
    if (
        (vendorStatus === 'Online' ||
        (openService && openService?.status === ServiceStatus.ACCEPTED)) &&
      !isTracking
    ) {
      handleTrackingStatus();
    }
    if (
      vendorStatus === 'Offline' &&
      (!openService || openService.status !== ServiceStatus.ACCEPTED) &&
      isTracking
    ) {
      stopTracking();
    }
  }, [vendorStatus, openService]);

  const handleTrackingStatus = async () => {
    const { ok } = await startTracking()

    if (!ok) {
      // startTracking already surfaced the appropriate dialog: a persistent, actionable
      // permission prompt (Agora não / Abrir Definições) or the tracking-error alert.
      handleUpdateVendorStatus(true);
      return;
    }
  }

  const renderBalance = useCallback(() => {
    const balance = Number(wallet?.balanceFloat);
    const decimalPlaces = wallet?.decimal_places;
    if (isNaN(balance) || balance === null || balance === undefined) {
      return '0,00 €';
    }

    return balance.toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimalPlaces ?? 2,
      maximumFractionDigits: decimalPlaces ?? 2
    });
  }, [wallet]);

  const renderWalletName = useCallback(() => {
    const walletName = wallet?.name;
    if (!walletName) {
      return;
    }
    if (walletName.toLowerCase().includes('balance')) {
      return walletName;
    } else {
      return `${walletName} ${t('wallet.balance.name')}`;
    }
  }, [wallet]);

  const getVendorStatus = () => {
    setIsLoading((prev) => ({ ...prev, vendorStatus: true }));
    api.get(API_ROUTES.VENDOR_GET_STATUS)
      .then(async response => {
        const deviceId = response?.data?.data?.device_id;
        const isOnline = response?.data?.data?.status === 'Online';
        const currentDeviceId = await getDeviceId();

        setDisableStatusVendor(
          Boolean(deviceId && isOnline && deviceId !== currentDeviceId)
        );
        setVendorStatus(isOnline ? 'Online' : 'Offline');
      })
      .catch(error => {
        if (error?.response?.status !== 401) {
          openDialog({
            icon: <XIcon color={Colors.primary} />,
            title: t('errors.status_load.title'),
            subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.status_load.subtitle'),
            closeAfterMSeconds: 2000,
            closeOnClickOutside: true,
          })
        }
        setVendorStatus('Offline');
      })
      .finally(() => {
        setIsLoading((prev) => ({ ...prev, vendorStatus: false }));
      })
  }

  const handleUpdateVendorStatus = async (bypassTrackingVerification: boolean = false) => {
    if (vendorStatus === 'Offline' && vendorData?.at_user && vendorData?.at_valid === false) {
      openDialog({
        icon: <XIcon color={Colors.primary} />,
        title: t('errors.go_online_blocked.title'),
        subtitle: t('profile.edit.at_invalid.go_online_blocked'),
        closeOnClickOutside: true,
      });
      return;
    }

    setDisableStatusVendor(true);
    const deviceId = await getDeviceId();
    let trackingStatus = false;

    if (!bypassTrackingVerification) {
      const result = await startTracking()

      if (!result.ok) {
        // startTracking already surfaced the relevant dialog: on permission denial a
        // persistent, actionable prompt (Agora não / Abrir Definições); on a genuine
        // tracking failure the auto-dismissing error alert. No extra dialog here — firing
        // one would clobber the persistent permission prompt (single-slot DialogContext).
        setDisableStatusVendor(false);
        return;
      }
      trackingStatus = result.ok;
    }

    api.put(API_ROUTES.VENDOR_UPDATE_STATUS, {
      status: vendorStatus === 'Online' ? 'Offline' : 'Online',
      device_id: deviceId
    })
      .then(() => {
        setVendorStatus(vendorStatus === 'Online' ? 'Offline' : 'Online');
      })
      .catch((error) => {
        if (error?.response?.status === 422) {
            openDialog({
              icon: <XIcon color={Colors.primary} />,
              title: t('errors.go_online_blocked.title'),
              subtitle: t('errors.account_under_verification'),
              closeAfterMSeconds: 2000,
              closeOnClickOutside: true,
              onClose: () => {
                if (vendorStatus === 'Offline' && trackingStatus) {
                  stopTracking();
                }
              }
            })
          return;
        }
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.status_update.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.status_update.subtitle'),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
          onClose: () => {
            if (vendorStatus === 'Offline' && trackingStatus) {
              stopTracking();
            }
          }
        })
      })
      .finally(() => {
        setDisableStatusVendor(false);
      });
  }

  const handleOperationAreas = async () => {
    setIsLoading((prev) => ({ ...prev, operationAreas: true }));
    await getOperationAreas()
    setIsLoading((prev) => ({ ...prev, operationAreas: false }));
  }

  return (
    <SafeAreaView className={`pt-5 h-full relative bg-strongest`}>
      {/* Cabeçalho compacto: avatar, saudação e notificações numa só linha.
          O logótipo saiu daqui — está no arranque, na autenticação e no ícone da
          app — e ocupava ~70pt do topo, o espaço mais valioso do ecrã. A marca
          continua presente no âmbar e na tipografia. */}
      <View className="px-5 bg-strongest">
        {/* Brilho âmbar muito ténue atrás da saudação: dá carácter ao topo sem
            acrescentar um elemento novo nem competir com os cartões. */}
        <LinearGradient
          colors={['rgba(250,187,91,0.10)', 'rgba(250,187,91,0)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: 'absolute', top: -60, left: -40, right: -40, height: 200, borderRadius: 200 }}
          pointerEvents="none"
        />
        <UserHeader />
      </View>

      {/* Um único ritmo vertical (gap) para toda a coluna: antes cada bloco
          trazia o seu próprio padding e as distâncias entre secções variavam. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 16, paddingBottom: tabBarContentPadding(insets.bottom), gap: 16 }}
      >
        {session && !isLoadingUserData && (
          <View className="px-5" style={{ gap: 10 }}>
            <DocumentsValidating />
            {permissionsChecked && !locationPermission.background && (
              <GeolocationPermissionBanner
                onRequestPermission={handleRequestGeolocationPermission}
                isLoading={geoLoading}
                hasPermission={locationPermission.background}
              />
            )}
            {(
              !vendorData?.at_user ||
              !vendorData?.company_address ||
              !vendorData?.iban ||
              (vendorData?.missing_documents?.length ?? 0) > 0 ||
              vendorData?.user?.phone_number_verified_at === null ||
              vendorData?.user?.email_verified_at === null
            ) && (
                <View>
                  <CompleteYourProfile />
                </View>
            )}
            {vendorData?.at_user && vendorData?.at_valid === false && (
              <TouchableOpacity
                onPress={() => router.push('/(app)/(modals)/(profile)/edit-at-user')}
                className="flex-row justify-between items-center bg-[#DA4040] p-3 rounded-xl mt-2"
              >
                <View className="w-[10%]">
                  <View className="w-7 h-7">
                    <AttentionIcon color={Colors.secondary} />
                  </View>
                </View>
                <View className="w-[90%]">
                  <CustomText color="secondary">
                    {t('profile.edit.at_invalid.banner')}
                  </CustomText>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Documento a expirar: aparece antes de o técnico ficar bloqueado. */}
        <DocumentExpiryBanner />

        <NotificationsDisabledBanner />

        {openService && <OpenService />}

        <View className="px-5">
          <WeekStats />
        </View>

        <AutoAcceptCard />

        <PendingRequestsCard />

        <Schedules />

        <HomeShortcuts />
      </ScrollView>
      {/* {openService && <ServiceInProgress isHome />} */}
    </SafeAreaView>
  )
}

export default Home
