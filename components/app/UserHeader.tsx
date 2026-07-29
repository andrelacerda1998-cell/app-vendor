import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, TouchableWithoutFeedback, View } from 'react-native';
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

        <View className="flex-1 pr-4">
          <CustomText size="large" color="secondary" boldness="bolder" numberOfLines={1}>
            {t('user_header.hello', { name: vendorData?.user?.first_name ?? '' })}
          </CustomText>
          <CustomText size="small" color="muted" boldness="regular" numberOfLines={1} classes="mt-0.5">
            {(vendorData?.at_user && vendorData?.company_address && vendorData?.iban &&
              vendorData?.user?.phone_number_verified_at && vendorData?.user?.email_verified_at)
              ? t('user_header.ready')
              : t('user_header.finish_account')}
          </CustomText>
        </View>

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
