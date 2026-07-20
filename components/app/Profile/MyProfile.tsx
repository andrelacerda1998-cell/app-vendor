import BackHeader from '@/components/app/BackHeader';
import { CustomText } from "@/components/CustomText";
import CustomTextInput from "@/components/CustomTextInput";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import DatePicker from '@/components/DatePicker';
import { ThemedText } from '@/components/ThemedText';
import TouchOpacity from '@/components/TouchOpacity';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { VendorDataInterface } from "@/types/session";
import { parseValidDate } from "@/utils/date";
import { validateNIF } from "@/utils";
import { Feather, MaterialIcons, Octicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react'
import { Control, Controller, useForm } from 'react-hook-form';
import { useTranslation } from "react-i18next";
import { View, StatusBar, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
interface MyProfileProps {
  vendorData: VendorDataInterface | null
}

const MyProfile: React.FC<MyProfileProps> = ({
  vendorData
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString?: string | null) => {
    const date = parseValidDate(dateString);
    if (!date) return "—";
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString('en-GB', options);
  };

  return (
    <ScrollView className="space-y-4 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className='mt-8'>
        <CustomText classes="mb-1" color="gray_strong" boldness="semiBold" numberOfLines={1} size="small">
          {t('profile.my_profile.birth_date')}
        </CustomText>
        <CustomText size="medium" color="secondary" boldness="semiBold">
          {formatDate(vendorData?.user.date_birthday)}
        </CustomText>
        <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>

      <View>
        <CustomText classes="mb-1" color="gray_strong" boldness="semiBold" numberOfLines={1} size="small">
          {t('profile.my_profile.nif')}
        </CustomText>
        <CustomText size="medium" color="secondary" boldness="semiBold">
          {vendorData?.user.nif}
        </CustomText>
        <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>

      <View>
        <CustomText classes="mb-1" color="gray_strong" boldness="semiBold" numberOfLines={1} size="small" >
          {t('profile.my_profile.phone_number')}
        </CustomText>
        <CustomText size="medium" color="secondary" boldness="semiBold">
          {vendorData?.user.phone_number}
        </CustomText>
        <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>

      <View>
        <CustomText classes="mb-1" color="gray_strong" boldness="semiBold" numberOfLines={1} size="small">
          {t('profile.my_profile.password')}
        </CustomText>
        <View className="flex-row space-x-1 py-2">
          {Array.from({ length: 16 }).map((_, index) => (
            <View key={index} className="h-2 w-2 rounded-full bg-secondary"></View>
          ))}
        </View>
        <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>
    </ScrollView>
  )
}

export default MyProfile
