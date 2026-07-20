import { ThemedText } from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import { Entypo, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from 'react-native'
import TouchOpacity from '@/components/TouchOpacity'
import BackHeader from '@/components/app/BackHeader'
import { useApi } from '@/contexts/ApiContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import { useSession } from '@/contexts/SessionContext'
import { useTranslation } from "react-i18next"
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import XIcon from "@/assets/icons/x"
import EmailConfirmation from "@/components/EmailConfirmation"

enum Status {
  PENDING = "pending",
  VERIFIED = "verified",
  SENT = "sent",
  ERROR = "error",
}

const ConfirmEmail = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData, setVendorData } = useSession();
  const [status, setStatus] = useState<Status>(Status.PENDING);
  const [loading, setLoading] = useState(false);

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.push("/(app)/(tabs)/home");
  };

  

  return (
    <SafeAreaView className="flex-1 bg-primary p-5">
      {/* <StatusBar backgroundColor={Colors.secondary} animated /> */}

      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <ThemedText type="defaultBold" color={Colors.primary} numberOfLines={1}>
            {t('session.confirm_email.header')}
          </ThemedText>
        )}
        onBack={onClose}
      />

      <EmailConfirmation onNext={onClose} />
    </SafeAreaView>
  )
}

export default ConfirmEmail;