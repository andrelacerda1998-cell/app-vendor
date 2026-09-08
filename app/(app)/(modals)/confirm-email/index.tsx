import { CustomText } from '@/components/CustomText'
import { Entypo, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from 'react-native'
import BackHeader from '@/components/app/BackHeader'
import { useApi } from '@/contexts/ApiContext'
import { useSession } from '@/contexts/SessionContext'
import { useTranslation } from "react-i18next"
import EmailConfirmation from "@/components/EmailConfirmation"
import { Colors } from '@/constants/Colors';

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
    <SafeAreaView className="flex-1 p-5" style={{ backgroundColor: Colors.primary }}>
      {/* <StatusBar backgroundColor={Colors.secondary} animated /> */}

      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText size="medium" boldness="bold" color="primary" numberOfLines={1}>
            {t('session.confirm_email.header')}
          </CustomText>
        )}
        onBack={onClose}
      />

      <EmailConfirmation onNext={onClose} />
    </SafeAreaView>
  )
}

export default ConfirmEmail;