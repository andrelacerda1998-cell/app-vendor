import React from 'react'
import { TouchableOpacity, View } from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import { CustomText } from "./CustomText"
import { Feather } from "@expo/vector-icons"
import { Colors } from "@/constants/Colors"
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next"
import { cardShadow } from "@/components/ui"

/** Aviso de perfil incompleto — bloqueia a receção de pedidos, por isso tem de saltar à vista. */
const CompleteYourProfile = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/(app)/(complete-profile)/CompleteProfile')}
    >
      <LinearGradient
        colors={['rgba(255,90,95,0.30)', 'rgba(255,90,95,0.10)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          { borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,90,95,0.55)' },
          cardShadow,
        ]}
      >
        <View className="flex-row items-center p-4">
          <View
            className="w-11 h-11 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: Colors.danger }}
          >
            <Feather name="alert-triangle" size={22} color={Colors.strongest} />
          </View>
          <View className="flex-1">
            <CustomText size="medium" color="secondary" boldness="bolder" numberOfLines={2}>
              {t('complete_profile.notice')}
            </CustomText>
            <CustomText size="small" color="secondary" boldness="regular" numberOfLines={2} classes="mt-0.5 opacity-80">
              {t('complete_profile.subtitle')}
            </CustomText>
          </View>
          <Feather name="chevron-right" size={22} color={Colors.danger} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export default CompleteYourProfile
