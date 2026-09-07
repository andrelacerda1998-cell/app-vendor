import React, { useEffect, useRef, useState } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
import { Entypo } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import { useApi } from '@/contexts/ApiContext'
import { useSession } from '@/contexts/SessionContext'
import { useDialog } from '@/contexts/DialogContext'
import { useLocation } from '@/contexts/LocationContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import { getDeviceId } from '@/utils'
import XIcon from '@/assets/icons/x'

/**
 * "Receber pedidos de serviços" — toggle Online/Offline do vendor (vive no Perfil).
 * Mantém a lógica original: verificação AT, tracking de localização e PUT /vendor/status.
 */
const ReceiveRequestsCard = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData, vendorStatus, setVendorStatus } = useSession();
  const { openDialog } = useDialog();
  const { startTracking, stopTracking } = useLocation();

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [disableStatusVendor, setDisableStatusVendor] = useState(false);
  const toggleAnimation = useRef(new Animated.Value(vendorStatus === 'Online' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(toggleAnimation, {
      toValue: vendorStatus === 'Online' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [vendorStatus]);

  useEffect(() => {
    setIsLoadingStatus(true);
    api.get(API_ROUTES.VENDOR_GET_STATUS)
      .then(async (response: any) => {
        const deviceId = response?.data?.data?.device_id;
        const isOnline = response?.data?.data?.status === 'Online';
        const currentDeviceId = await getDeviceId();

        setDisableStatusVendor(Boolean(deviceId && isOnline && deviceId !== currentDeviceId));
        setVendorStatus(isOnline ? 'Online' : 'Offline');
      })
      .catch(() => {})
      .finally(() => setIsLoadingStatus(false));
  }, []);

  const handleUpdateVendorStatus = async () => {
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

    if (vendorStatus === 'Offline') {
      const result = await startTracking();
      if (!result.ok) {
        // startTracking já mostrou o diálogo de permissão/erro apropriado.
        setDisableStatusVendor(false);
        return;
      }
      trackingStatus = result.ok;
    }

    api.put(API_ROUTES.VENDOR_UPDATE_STATUS, {
      status: vendorStatus === 'Online' ? 'Offline' : 'Online',
      device_id: deviceId,
    })
      .then(() => {
        setVendorStatus(vendorStatus === 'Online' ? 'Offline' : 'Online');
      })
      .catch((error: any) => {
        const subtitle = error?.response?.status === 422
          ? t('errors.account_under_verification')
          : error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.status_update.subtitle');

        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.status_update.title'),
          subtitle,
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
          onClose: () => {
            if (vendorStatus === 'Offline' && trackingStatus) {
              stopTracking();
            }
          },
        });
      })
      .finally(() => setDisableStatusVendor(false));
  };

  const isOnline = vendorStatus === 'Online';

  return (
    <View className="rounded-2xl border p-4 mt-5" style={{ backgroundColor: Colors.card,  borderColor: Colors.line }}>
      <View className="w-full flex-row justify-between items-center">
        <View className="flex-1 pr-4">
          <CustomText size="medium" color="secondary" boldness="bold" numberOfLines={2}>
            {t('session.status.receive_requests')}
          </CustomText>
          <View className="flex-row items-center mt-1">
            <View className={`w-2.5 h-2.5 rounded-full mr-2 ${isOnline ? 'bg-[#80FA5B]' : 'bg-[#FA805B]'}`} />
            <CustomText size="small" color="muted" numberOfLines={1}>
              {isOnline ? t('session.status.online') : t('session.status.offline')}
            </CustomText>
          </View>
        </View>
        {/* 48×28 era abaixo do mínimo tocável e o estado só se lia pela cor.
            O hitSlop dá a área, e o role/state anunciam ligado/desligado. */}
        <View className="w-12 h-7">
          <TouchableOpacity
            className={`w-full h-full relative rounded-full ${disableStatusVendor && 'opacity-30'}`} style={{ backgroundColor: Colors.gray_strong }}
            onPress={handleUpdateVendorStatus}
            disabled={isLoadingStatus || disableStatusVendor}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="switch"
            accessibilityLabel={t('session.status.receive_requests')}
            accessibilityState={{ checked: isOnline, disabled: isLoadingStatus || disableStatusVendor }}
          >
            <Animated.View
              className="absolute top-1 h-5 w-5 rounded-full items-center justify-center"
              style={{
                backgroundColor: isOnline ? Colors.support_primary : Colors.gray_light,
                transform: [{
                  translateX: toggleAnimation.interpolate({ inputRange: [0, 1], outputRange: [4, 24] }),
                }],
              }}
            >
              {isOnline && <Entypo name="flash" size={18} color={Colors.strongest} />}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ReceiveRequestsCard;
