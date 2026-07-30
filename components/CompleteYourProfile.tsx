import React from 'react'
import { TouchableOpacity, View } from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import { CustomText } from "./CustomText"
import { Feather } from "@expo/vector-icons"
import { Colors } from "@/constants/Colors"
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next"
import { cardShadow } from "@/components/ui"
import { useSession } from "@/contexts/SessionContext"

/** Aviso de perfil incompleto — bloqueia a receção de pedidos, por isso tem de saltar à vista. */
const CompleteYourProfile = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { vendorData } = useSession();

  /**
   * O que falta em concreto, pela mesma ordem do ecrã de Estado da conta.
   * Dizer "completa o teu perfil" sem dizer o quê obrigava o técnico a entrar
   * e procurar. A morada de faturação é o caso mais silencioso: sem ela, a
   * criação da conta de faturação rebenta no InvoiceXpress e ele nunca fica
   * online, sem nada na app que o explique.
   */
  const missing: string[] = [];
  if ((vendorData?.missing_documents?.length ?? 0) > 0) missing.push(t('complete_profile.missing.documents'));
  if (!vendorData?.user?.phone_number_verified_at) missing.push(t('complete_profile.missing.phone'));
  if (!vendorData?.user?.email_verified_at) missing.push(t('complete_profile.missing.email'));
  if (!vendorData?.at_user) missing.push(t('complete_profile.missing.at_user'));
  if (!vendorData?.company_address) missing.push(t('complete_profile.missing.company_address'));
  if (!vendorData?.iban) missing.push(t('complete_profile.missing.iban'));

  /**
   * Contagem em vez da lista toda. Enumerar tudo separado por " · " nao cabia
   * no cartao: cortava a meio ("morada de faturacao…") e o tecnico nem chegava
   * a ler o que faltava. O detalhe esta a um toque, no ecra seguinte.
   */
  const subtitle = missing.length > 0
    ? t(missing.length === 1 ? 'complete_profile.missing_one' : 'complete_profile.missing_many', {
        count: missing.length,
      })
    : t('complete_profile.subtitle');

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
            <CustomText size="small" color="secondary" boldness="regular" numberOfLines={3} classes="mt-0.5 opacity-80">
              {subtitle}
            </CustomText>
          </View>
          <Feather name="chevron-right" size={22} color={Colors.danger} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export default CompleteYourProfile
