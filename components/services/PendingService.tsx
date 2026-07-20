import { useService } from "@/contexts/ServiceContext";
import React from 'react'
import { View } from "react-native"
import CustomTouchableOpacity from "../CustomTouchableOpacity";
import { CustomText } from "../CustomText";
import ArrowIcon from "@/assets/icons/arrow";
import { Colors } from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ServiceStatus } from "@/types/services";
import { useTranslation } from "react-i18next";

const PendingService = () => {
  const { t } = useTranslation();
  const { pendingService } = useService();

  return (
    <View className="px-5 my-2">
      <CustomTouchableOpacity
        size="large"
        type="primary"
        onPress={() => {
          router.navigate(`/(app)/(bottom-sheets)/(services)/proposal/${pendingService?.id}`);
        }}
      >
        <View className="flex-row items-center gap-4">
          <View className="bg-strongest p-2 items-center justify-center rounded-lg">
            <Feather name="clock" size={24} color={Colors.secondary} />
          </View>
          <View className="flex-1">
            <CustomText color="support_primary" size="small" boldness="bold" numberOfLines={1}>{pendingService?.service_type?.name}</CustomText>
            <CustomText color="gray_medium" size="extraSmall" boldness="regular" numberOfLines={1}>
              {t('services.service.pending')}
            </CustomText>
          </View>
          <View className="h-4 w-4">
            <ArrowIcon position="right" color={Colors.gray_medium} />
          </View>
        </View>
      </CustomTouchableOpacity>
    </View>
  )
}

export default PendingService