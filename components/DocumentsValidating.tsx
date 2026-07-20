import React from 'react'
import {TouchableOpacity, View} from "react-native"
import { CustomText } from "./CustomText"
import AttentionIcon from "@/assets/icons/attention"
import { Colors } from "@/constants/Colors"
import {useSession} from "@/contexts/SessionContext";
import {useRouter} from "expo-router";
import { useTranslation } from "react-i18next"

const DocumentsValidating = () => {
  const { t } = useTranslation();
  const { vendorData } = useSession();
  const router = useRouter();

  if (!vendorData?.pending_documents?.length && !vendorData?.missing_documents?.length) {
      return null;
  }

  if (vendorData?.pending_documents?.length > 0 && vendorData?.missing_documents?.length <= 0) {
      return (
          <TouchableOpacity onPress={()=>router.push('/(app)/(modals)/documents')}  className="mb-2 flex-row justify-between items-center bg-[#6A40DA] p-3 rounded-xl">
              <View className="w-[10%]">
                  <View className="w-7 h-7">
                      <AttentionIcon color={Colors.secondary} />
                  </View>
              </View>
              <View className="w-[90%]">
                  <CustomText color="secondary">
                      {t('documents_validating.pending')}
                  </CustomText>
              </View>
          </TouchableOpacity>
      )
  }

  return (
    <TouchableOpacity onPress={()=>router.push('/(app)/(modals)/documents')} className="mb-2 flex-row justify-between items-center bg-[#6A40DA] p-3 rounded-xl">
      <View className="w-[10%]">
        <View className="w-7 h-7">
          <AttentionIcon color={Colors.secondary} />
        </View>
      </View>
      <View className="w-[90%]">
        <CustomText color="secondary">
          {t('documents_validating.missing')}
        </CustomText>
      </View>
    </TouchableOpacity>
  )
}

export default DocumentsValidating
