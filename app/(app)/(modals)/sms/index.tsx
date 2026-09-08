import { Entypo, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from 'react-native';
import BackHeader from '@/components/app/BackHeader'
import { useTranslation } from "react-i18next"
import { CustomText } from "@/components/CustomText"
import { Controller, useForm } from "react-hook-form"
import SmsVerification from "@/components/SmsVerification"
import { Colors } from '@/constants/Colors';



const Sms = () => {
  const { t } = useTranslation();

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.push("/(app)/(tabs)/home");
  };

  return (
    <SafeAreaView className="flex-1 p-5" style={{ backgroundColor: Colors.primary }}>
      {/* <StatusBar backgroundColor={Colors.primary} animated /> */}

      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText size="medium" boldness="bold" color="secondary" numberOfLines={1}>
            {t('session.sms.header')}
          </CustomText>
        )}
        onBack={onClose}
      />

      <View className="flex-1 mb-12">
        <SmsVerification onNext={onClose} />
      </View>
    </SafeAreaView>
  )
}

export default Sms;