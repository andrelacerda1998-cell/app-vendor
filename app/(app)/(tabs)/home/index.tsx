import ServiceShortcut from '@/components/app/Home/ServiceShortcut';
import UserHeader from '@/components/app/UserHeader';
import PiquetLogo from '@/components/PiquetLogo';
import { Colors } from '@/constants/Colors';
import {AntDesign, Entypo, Feather, Ionicons} from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Alert, ScrollView, Animated, Modal, NativeScrollEvent, NativeSyntheticEvent, TextInput, Button, TouchableOpacity, Platform } from 'react-native'
import { FlatList, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '@/components/CustomText';
import OperationAreaCard from "@/components/OperationAreaCard";
import { WalletInterface } from "@/types/session";
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import DocumentsValidating from "@/components/DocumentsValidating";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { useService } from "@/contexts/ServiceContext";
import OpenService from "@/components/services/OpenService";

import PendingService from "@/components/services/PendingService";

import Schedules from "@/components/app/Home/Schedules";
import {useSession} from "@/contexts/SessionContext";
import { useTranslation } from "react-i18next";
import XIcon from "@/assets/icons/x";
import { useDialog } from "@/contexts/DialogContext";
import TouchOpacity from "@/components/TouchOpacity";
import {useLocation} from "@/contexts/LocationContext";
import {getDeviceId} from "@/utils";
import { ServiceStatus } from "@/types/services";
import CompleteYourProfile from "@/components/CompleteYourProfile";
import GeolocationPermissionBanner from "@/components/warnings/GeolocationPermissionBanner";
import AttentionIcon from "@/assets/icons/attention";
import OperationAreaCardCounter from "@/components/OperationAreaCardCounter";
import HomeSection from "@/components/HomeSection";
import AvailabilityElements from "@/components/app/Schedule/AvailabilityElements";
import ScheduleAvailability from "@/components/app/Home/ScheduleAvailability";
import RequestJobs from "@/components/app/Home/RequestJobs";

const Home = () => {
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
            title: t('errors.title'),
            subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
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
        title: t('errors.title'),
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
              title: t('errors.title'),
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
          title: t('errors.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
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
    <SafeAreaView className={`pt-5 h-full relative bg-strongest ${Platform.OS === 'android' ? 'pb-[100px]' : 'pb-[50px]'}`}>
      <View className="px-5 bg-strongest rounded-b-3xl">
        <View className="flex items-center pb-2">
          <PiquetLogo color={Colors.support_primary} />
        </View>
        <View className="bg-strongest py-2">
          <UserHeader />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        {session && !isLoadingUserData && (
          <View className="py-4 px-5">
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

        {openService && <OpenService />}
        {/*{pendingService && <PendingService />}*/}

        <View className="items-center py-4">
          {isLoading.wallet ? (
            <View className="flex-1 justify-end">
              <View className="rounded-lg overflow-hidden mx-auto">
                <View className="w-20 h-6 bg-[#111215]"></View>
              </View>
              <View className="mt-2 rounded-md overflow-hidden">
                <View className="w-32 h-4 bg-[#111215]"></View>
              </View>
            </View>
          ) : (
            <View className="items-center">
              <CustomText size="title" color="secondary" numberOfLines={1}>
                {renderBalance()}
              </CustomText>
              {/*<CustomText size="small" color="gray_medium" numberOfLines={1}>
                {renderWalletName()}
              </CustomText>*/}
            </View>
          )}
        </View>

        <View className="flex flex-row items-center justify-evenly flex-wrap py-4 px-5">
          {isLoading.vendorStatus ? (
            <View className="w-full flex-row justify-between items-center">
              <View>
                <View className="rounded-md overflow-hidden w-16 h-4">
                  <View className="w-full h-full bg-[#111215]"></View>
                </View>
                <View className="flex-row items-center space-x-1 mt-1">
                  <View className="rounded-full overflow-hidden w-3 h-3">
                    <View className="w-full h-full bg-[#111215]"></View>
                  </View>
                  <View className="rounded-md overflow-hidden w-16 h-4">
                    <View className="w-full h-full bg-[#111215]"></View>
                  </View>
                </View>
              </View>
              <View className="w-12 h-7 relative">
                <View className="rounded-full overflow-hidden w-full h-full">
                  <View className="w-full h-full bg-[#111215]"></View>
                </View>
                <View className="absolute left-1 top-1 rounded-full overflow-hidden w-5 h-5">
                  <View className="w-full h-full bg-[#272727]"></View>
                </View>
              </View>
            </View>
          ) : (
            <View className="w-full flex-row justify-between items-center">
              <View>
                <CustomText size="medium" color="secondary" numberOfLines={1}>
                  {t('session.status.title')}
                </CustomText>
                <View className="flex-row items-center space-x-1">
                  <View className={`w-3 h-3 rounded-full ${vendorStatus === 'Online' ? 'bg-[#80FA5B]' : 'bg-[#FA805B]'}`}></View>
                  <CustomText size="small" color="gray_medium" numberOfLines={1}>
                    {vendorStatus === 'Online' ? t('session.status.online') : t('session.status.offline')}
                  </CustomText>
                </View>
              </View>
              <View className="w-12 h-7">
                <TouchableOpacity
                  className={`bg-gray_strong w-full h-full relative rounded-full ${disableStatusVendor && 'opacity-30'}`}
                  onPress={() => handleUpdateVendorStatus()}
                  disabled={isLoading.vendorStatus || disableStatusVendor}
                >
                  <Animated.View
                    className={`absolute top-1 h-5 w-5 ${vendorStatus === 'Online' ? 'bg-support_primary' : 'bg-gray_light'} rounded-full items-center justify-center`}
                    style={{
                      transform: [{
                        translateX: toggleAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [4, 24]
                        })
                      }],
                    }}
                  >
                    {vendorStatus === 'Online' && (
                      <Entypo name="flash" size={18} color={Colors.strongest} />
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </View>
          )}
            {/* //for testing purposes
              <View>
                <Button title='fake state change' onPress={()=> {
                  setActiveService(!activeService); //mock the end of service to test if the notif fades
                }}/>
              </View> */}


          {/*<ServiceShortcut
            Icon={() => <Entypo name="back-in-time" size={24} color={Colors.support_primary} />}
            label="Send"
            onPress={() => {
              // router.push('/(app)/(bottom-sheets)/(services)/rate/58');
              // router.push('/(app)/(bottom-sheets)/service/94');
            }}
            // notifications={3}
          />
          <ServiceShortcut
            Icon={() => <Entypo name="time-slot" size={24} color={Colors.support_primary} />}
            label="Receive"
            onPress={() => {
              // goToProgress();
            }}
          />
          <ServiceShortcut
            Icon={() => <Entypo name="calendar" size={24} color={Colors.support_primary} />}
            label="Other"
            onPress={() => {}}
          />*/}
        </View>

        <RequestJobs />

        <Schedules />

        <ScheduleAvailability />
      </ScrollView>
      {/* {openService && <ServiceInProgress isHome />} */}
    </SafeAreaView>
  )
}

export default Home
