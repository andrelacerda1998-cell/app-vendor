import React from 'react'
import {TouchableOpacity, View} from "react-native"
import { CustomText } from "./CustomText"
import AttentionIcon from "@/assets/icons/attention"
import { Colors } from "@/constants/Colors"
import {useSession} from "@/contexts/SessionContext";
import {useRouter} from "expo-router";
import { useTranslation } from "react-i18next"

const CompleteYourProfile = () => {
  const { vendorData } = useSession();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={()=> {
        // if (
        //   vendorData?.user.gender_id === null ||
        //   !vendorData?.user.date_birthday ||
        //   !vendorData?.user.nif
        // ) {
          router.push('/(app)/(complete-profile)/CompleteProfile')
        // } else if (
        //   !vendorData?.user.phone_number
        // ) {
        //   router.push('/(app)/(tabs)/profile')
        //   router.push('/(app)/(modals)/(profile)/edit-profile')
        // } else if (
        //   vendorData?.user?.phone_number_verified_at === null
        // ) {
        //   router.push('/(app)/(modals)/sms')
        // } else if (
        //   vendorData?.user?.email_verified_at === null
        // ) {
        //   router.push('/(app)/(modals)/confirm-email')
        // } else if (
        //   !vendorData?.at_user ||
        //   !vendorData?.company_address ||
        //   !vendorData?.iban
        // ) {
        //   router.push('/(app)/(tabs)/profile')
        //   router.push('/(app)/(modals)/(profile)/edit-payment')
        // }
      }}
      className="flex-row justify-between items-center bg-[#6A40DA] p-3 rounded-xl"
    >
      <View className="w-[10%]">
        <View className="w-7 h-7">
          <AttentionIcon color={Colors.secondary} />
        </View>
      </View>
      <View className="w-[90%]">
        <CustomText color="secondary">
          {t('complete_profile.notice')}
        </CustomText>
      </View>
    </TouchableOpacity>
  )
}

export default CompleteYourProfile
