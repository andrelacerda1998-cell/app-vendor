import BackHeader from '@/components/app/BackHeader';
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { ThemedText } from '@/components/ThemedText';
import TouchOpacity from '@/components/TouchOpacity';
import { Colors } from '@/constants/Colors';
import { Entypo, Feather, Octicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useRef } from 'react'
import { useTranslation } from "react-i18next";
import { View, StatusBar, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import {VendorDataInterface} from "@/types/session";
import IBAN from "iban";

interface PaymentProps {
    vendorData: VendorDataInterface | null
}

const Payment = ({ vendorData }: PaymentProps) => {
  const { t } = useTranslation();

  return (
    <ScrollView className="space-y-4 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
      <View>
          <CustomText color="gray_strong" boldness="semiBold" numberOfLines={1} classes="mb-1" size="small">
            {t('profile.my_profile.iban')}
          </CustomText>
          <CustomText size="medium" color="secondary" boldness="semiBold">
            {vendorData?.iban ? IBAN.printFormat(vendorData?.iban) : t('profile.payments.empty_iban')}
          </CustomText>
          <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>
      <View>
          <CustomText color="gray_strong" boldness="semiBold" numberOfLines={1} classes="mb-1" size="small">
            {t('profile.payments.price_rate')}
          </CustomText>
          <CustomText size="medium" color="secondary" boldness="semiBold">
            {vendorData?.price_rate ? `${vendorData?.price_rate}€` : t('profile.payments.empty_price_rate')}
          </CustomText>
          <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>
      <View>
          <CustomText color="gray_strong" boldness="semiBold" numberOfLines={1} classes="mb-1" size="small">
            {t('profile.payments.company_name')}
          </CustomText>
          <CustomText size="medium" color="secondary" boldness="semiBold" classes="mb-1">
            {vendorData?.company_name ? vendorData?.company_name : t('profile.payments.empty_company_name')}
          </CustomText>
          <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>
      {/* <View>
          <CustomText color="gray_strong" boldness="semiBold" numberOfLines={1}>
            {t('profile.payments.nif')}
          </CustomText>
          <CustomText size="large" color="secondary" boldness="semiBold">
            {vendorData?.nif ? vendorData?.nif : t('profile.payments.empty_nif')}
          </CustomText>
          <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View> */}
      <View>
          <CustomText color="gray_strong" boldness="semiBold" numberOfLines={1} classes="mb-1" size="small">
            {t('profile.payments.company_address')}
          </CustomText>
          <CustomText size="medium" color="secondary" boldness="semiBold">
            {vendorData?.company_address ? vendorData?.company_address : t('profile.payments.empty_company_address')}

          </CustomText>
          <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>
      <View>
          <CustomText color="gray_strong" boldness="semiBold" numberOfLines={1} classes="mb-1" size="small">
            {t('profile.payments.at_user')}
          </CustomText>
          <CustomText size="medium" color="secondary" boldness="semiBold">
            {vendorData?.at_user ? vendorData?.at_user : t('profile.payments.empty_at_user')}

          </CustomText>
          <View className="h-[1px] w-full bg-[#2F2F2F] rounded-full mt-2"></View>
      </View>
    </ScrollView>
  );
}

export default Payment
