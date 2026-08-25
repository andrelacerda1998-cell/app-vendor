import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Colors } from '@/constants/Colors'
import { Entypo, Feather, MaterialIcons, Octicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import TouchOpacity from '../TouchOpacity'
import * as Location from 'expo-location';
import { useApi } from '@/contexts/ApiContext'
import { useClickOutside } from 'react-native-click-outside'
import { useSession } from '@/contexts/SessionContext'
import { CustomText } from '../CustomText'
import NotificationIcon from "@/assets/icons/notification"
import { useTranslation } from "react-i18next"
import useVendorOnlineStatus from "@/hooks/useVendorOnlineStatus"

const UserHeader = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const dropDownRef = useClickOutside<View>(() => {
    toggleShowDropdown();
  });
  const { vendorData, setVendorData } = useSession();
  const [locationConsentStatus, setLocationConsentStatus] = useState<Location.PermissionStatus>();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);

  const [notifications, setNotifications] = useState<number>(0);

  /**
   * Online/offline no cabeçalho da Home.
   *
   * O interruptor que decide se o técnico recebe pedidos — o estado mais
   * importante da app — vivia escondido no Perfil, a três toques. Os Ganhos
   * chegavam a dizer "fica online para receberes pedidos" sem dizer onde.
   * A lógica é a mesma do Perfil (hook partilhado), não uma segunda cópia.
   */
  const online = useVendorOnlineStatus();

  useEffect(() => {
    if (vendorData?.user?.notifications !== undefined) {
      setNotifications(vendorData?.user?.notifications)
    }
  }, [vendorData?.user?.notifications]);

  useEffect(() => {
    (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        // @ts-ignore
        setLocationConsentStatus(status);
        if (status !== 'granted') {
            // todo not have permission
            return;
        }
    })();
  }, []);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: showDropdown ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showDropdown]);

  const toggleShowDropdown = () => {
    setShowDropdown(prev => !prev);
  }


  const handlePressNotification = () => {
    router.push('/(app)/(modals)/notifications')
  }

  return (
    <View>
      <View className="flex-row items-center justify-between w-full">
        {/* Avatar → Perfil */}
        <TouchableWithoutFeedback onPress={() => router.navigate('/(app)/(tabs)/profile')}>
          <View
            className="h-11 w-11 rounded-full overflow-hidden items-center justify-center mr-3"
            style={{ backgroundColor: Colors.brand }}
          >
            {vendorData?.user?.avatar?.src ? (
              <Image source={{ uri: vendorData.user.avatar.src }} className="w-full h-full" />
            ) : (
              <CustomText size="medium" boldness="bolder" color="on_brand">
                {(vendorData?.user?.first_name || vendorData?.username || '?').charAt(0).toUpperCase()}
              </CustomText>
            )}
          </View>
        </TouchableWithoutFeedback>

        <View className="flex-1 pr-3" style={{ minWidth: 0 }}>
          <CustomText size="large" color="secondary" boldness="bolder" numberOfLines={1}>
            {t('user_header.hello', { name: vendorData?.user?.first_name ?? '' })}
          </CustomText>
          {/* Só mostra "termina a conta" quando é o caso. O "Pronto para
              receber" saiu: o botão de estado ao lado já o diz, e repeti-lo só
              roubava largura ao nome. */}
          {!(vendorData?.at_user && vendorData?.company_address && vendorData?.iban &&
             vendorData?.user?.phone_number_verified_at && vendorData?.user?.email_verified_at) && (
            <CustomText size="small" color="muted" boldness="regular" numberOfLines={1} classes="mt-0.5">
              {t('user_header.finish_account')}
            </CustomText>
          )}
        </View>

        {/* Estado online/offline.
            "Online"/"Offline" é jargão de apps que muitos profissionais não
            conhecem, e um pontinho colorido não chega para dizer que aquilo é um
            interruptor. Passa a dizer o que FAZ ("A receber pedidos" / "Não
            recebes pedidos") com um switch de verdade ao lado, para ser óbvio o
            que está ligado e que se pode desligar tocando. */}
        <TouchableOpacity
          onPress={online.toggle}
          disabled={online.disabled}
          activeOpacity={0.8}
          className="flex-row items-center rounded-full pl-3 pr-1.5 py-1.5 mr-3"
          style={{
            flexShrink: 0,
            backgroundColor: online.isOnline ? 'rgba(35,230,158,0.14)' : Colors.brand_soft,
            borderWidth: 1,
            borderColor: online.isOnline ? 'rgba(35,230,158,0.45)' : `${Colors.brand}66`,
            opacity: online.disabled ? 0.5 : 1,
          }}
          accessibilityRole="switch"
          accessibilityState={{ checked: online.isOnline, disabled: online.disabled }}
          accessibilityLabel={t('session.status.receive_requests')}
        >
          <CustomText
            size="extraSmall"
            boldness="bold"
            color="secondary"
            style={{ color: online.isOnline ? Colors.success : Colors.brand }}
          >
            {online.isOnline ? t('session.status.on_label') : t('session.status.off_cta')}
          </CustomText>

          {/* Switch desenhado à mão: a bolinha encosta ao lado que está ativo,
              como qualquer interruptor de telemóvel. É o sinal universal de
              "isto liga e desliga", que o texto sozinho não dá. */}
          <View
            className="rounded-full ml-2 justify-center"
            style={{
              width: 34,
              height: 20,
              padding: 2,
              backgroundColor: online.isOnline ? Colors.success : `${Colors.brand}40`,
              alignItems: online.isOnline ? 'flex-end' : 'flex-start',
            }}
          >
            <View className="rounded-full" style={{ width: 16, height: 16, backgroundColor: online.isOnline ? Colors.secondary : Colors.brand }} />
          </View>
        </TouchableOpacity>

        <TouchOpacity
          onPress={handlePressNotification}
          className="w-6 h-6"
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          accessibilityRole="button"
          accessibilityLabel={
            notifications > 0
              ? t('session.notifications.title_with_count', { count: notifications })
              : t('session.notifications.title')
          }
        >
          <NotificationIcon color={Colors.secondary} />
          {
              notifications > 0 && (
                  <View
                      className={`
                  bg-secondary rounded-full h-5 w-5 flex items-center justify-center
                  absolute -top-3 -right-2
                `}
                  >
                    <CustomText
                        size="extraSmall"
                        boldness="bold"
                        color="support_secondary"
                    >
                      {notifications}
                    </CustomText>
                  </View>
              )
          }
        </TouchOpacity>
      </View>
    </View>
  )
}

export default UserHeader
