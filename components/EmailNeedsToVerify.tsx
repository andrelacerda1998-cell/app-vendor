import React from 'react'
import {TouchableOpacity, View} from "react-native"
import { CustomText } from "./CustomText"
import AttentionIcon from "@/assets/icons/attention"
import { Colors } from "@/constants/Colors"
import {useSession} from "@/contexts/SessionContext";
import {useRouter} from "expo-router";
import { useTranslation } from "react-i18next"

const EmailNeedsToVerify = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <TouchableOpacity onPress={()=>router.push('/(app)/(modals)/confirm-email')} className="flex-row justify-between items-center bg-[#6A40DA] p-3 rounded-xl">
      <View className="w-[10%]">
        <View className="w-7 h-7">
          <AttentionIcon color={Colors.secondary} />
        </View>
      </View>
      <View className="w-[90%]">
        <CustomText color="secondary">
          {t('general.email_verification_required')}
        </CustomText>
      </View>
    </TouchableOpacity>
  )
}

export default EmailNeedsToVerify
