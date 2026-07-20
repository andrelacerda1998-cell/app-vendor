import { ThemedText } from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import { Entypo, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import TouchOpacity from '@/components/TouchOpacity'
import BackHeader from '@/components/app/BackHeader'
import { useApi } from '@/contexts/ApiContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import { useSession } from '@/contexts/SessionContext'
import { useTranslation } from "react-i18next"
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { CustomText } from "@/components/CustomText"
import { Controller, useForm } from "react-hook-form"
import CustomTextInput from "@/components/CustomTextInput"
import { OtpInput } from "react-native-otp-entry";
import { useDialog } from "@/contexts/DialogContext"
import XIcon from "@/assets/icons/x"
import SmsVerification from "@/components/SmsVerification"



const Sms = () => {
  const { t } = useTranslation();

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.push("/(app)/(tabs)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-primary p-5">
      {/* <StatusBar backgroundColor={Colors.primary} animated /> */}

      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <ThemedText type="defaultBold" color={Colors.secondary} numberOfLines={1}>
            {t('session.sms.header')}
          </ThemedText>
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