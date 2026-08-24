import React, { useEffect, useState } from 'react'
import { TouchableOpacity, View, ActivityIndicator } from "react-native"
import { CustomText } from "../CustomText"
import LocationIcon from "@/assets/icons/location"
import { Colors } from "@/constants/Colors"
import { useTranslation } from "react-i18next"
import AsyncStorage from '@react-native-async-storage/async-storage'

interface GeolocationPermissionBannerProps {
  onRequestPermission: () => void;
  isLoading?: boolean;
  hasPermission?: boolean;
}

const GeolocationPermissionBanner = ({ onRequestPermission, isLoading = false, hasPermission = false }: GeolocationPermissionBannerProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    loadDismissedState();
  }, []);

  useEffect(() => {
    if (hasPermission) {
      AsyncStorage.removeItem('geolocation_banner_dismissed').catch(console.error);
    }
  }, [hasPermission]);

  const loadDismissedState = async () => {
    try {
      const dismissed = await AsyncStorage.getItem('geolocation_banner_dismissed');
      if (dismissed === 'true') {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error loading geolocation banner state:', error);
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem('geolocation_banner_dismissed', 'true');
      setIsVisible(false);
    } catch (error) {
      console.error('Error saving geolocation banner state:', error);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <View className="flex-row justify-between items-center bg-destination p-3 rounded-xl mt-2">
      <View className="w-[10%]">
        <View className="w-7 h-7">
          <LocationIcon color={Colors.secondary} />
        </View>
      </View>
      <View className="flex-1 ml-3">
        <CustomText color="secondary" boldness="semiBold" size="small">
          {t('geolocation.permission_title')}
        </CustomText>
        <CustomText color="secondary" size="extraSmall" classes="mt-1 opacity-90">
          {t('geolocation.permission_description')}
        </CustomText>
      </View>
      <View className="ml-2 flex-row items-center gap-2">
        <TouchableOpacity
          onPress={handleDismiss}
          disabled={isLoading}
          className="px-2 py-1"
        >
          <CustomText color="secondary" size="extraSmall">
            {t('geolocation.settings_dialog_cancel')}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRequestPermission}
          disabled={isLoading}
          className="px-3 py-1"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.secondary} size="small" />
          ) : (
            <CustomText color="secondary" boldness="bold" size="small">
              {t('geolocation.permission_button')}
            </CustomText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default GeolocationPermissionBanner
