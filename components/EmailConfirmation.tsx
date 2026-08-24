import { CustomText } from "@/components/CustomText"
import { Colors } from '@/constants/Colors'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router'
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useApi } from '@/contexts/ApiContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import { useSession } from '@/contexts/SessionContext'
import { useTranslation } from "react-i18next"
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { VendorDataInterface } from "@/types/session"

enum Status {
  PENDING = "pending",
  VERIFIED = "verified",
  SENT = "sent",
  ERROR = "error",
}

const EmailConfirmation = ({
  onNext
}: {
  onNext: (data: VendorDataInterface) => void;
}) => {
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

  const sendEmailVerification = () => {
    setLoading(true);
    api.post(API_ROUTES.EMAIL_VERIFY)
      .then((res) => {
        setStatus(Status.SENT);
      })
      .catch((err) => {
        if (err?.response?.data?.message === "Email already verified") {
          setVendorData({
            ...vendorData,
            user: {
              ...vendorData?.user,
              email_verified_at: new Date().toISOString(),
            },
          });
          onNext({
            ...vendorData,
            user: {
              ...vendorData?.user,
              email_verified_at: new Date().toISOString(),
            },
          } as VendorDataInterface);
          // return setStatus(Status.VERIFIED);
        } else {
          setStatus(Status.ERROR);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /**
   * Circulo com icone. Substitui o visto branco que estava em TODOS os estados:
   * um "check" no ecra de "confirma o teu email" diz que ja esta feito
   * precisamente quando ainda falta fazer -- e no estado de erro dizia-o com um
   * X la dentro, o que era simplesmente errado.
   */
  const Badge = ({ icon, tint, color }: { icon: any; tint: string; color: string }) => (
    <View
      className="items-center justify-center rounded-full self-center mb-5"
      style={{ width: 88, height: 88, backgroundColor: tint }}
    >
      <MaterialCommunityIcons name={icon} size={38} color={color} />
    </View>
  );

  return (
    // Era um bottom sheet: fundo proprio e cantos de 30 desenhavam um cartao
    // por cima do conteudo, a meio do onboarding.
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {status === Status.PENDING && (
        <View className="flex-1 justify-between">
          <View className="flex-1 justify-center">
            <Badge icon="email-outline" tint="rgba(250,187,91,0.14)" color={Colors.brand} />
            <CustomText size="title" boldness="bold" color="secondary" classes="text-center" numberOfLines={2}>
              {t('session.confirm_email.pending.title')}
            </CustomText>
            {/* Mostrar o endereco: e onde o tecnico vai procurar o email, e e
                a unica forma de dar por um erro de escrita no registo. */}
            {!!vendorData?.user?.email && (
              <CustomText size="medium" boldness="bold" color="secondary" classes="text-center mt-3" numberOfLines={1}>
                {vendorData.user.email}
              </CustomText>
            )}
            <CustomText size="medium" color="muted" classes="mt-2 text-center" numberOfLines={3}>
              {t('session.confirm_email.pending.subtitle')}
            </CustomText>
          </View>
          <View>
            {/* Os dois botoes eram ambos ambar e competiam. O primario passa a
                ser o que ajuda a acabar; adiar fica como saida discreta. */}
            <CustomTouchableOpacity
              type="support_primary"
              size="large"
              text={loading ? t('session.confirm_email.pending.sending') : t('session.confirm_email.pending.resend_email')}
              textSize="medium"
              textColor="on_brand"
              textBoldness="bold"
              onPress={sendEmailVerification}
              disabled={loading}
            />
            <CustomTouchableOpacity
              type="transparent"
              size="large"
              text={t('session.confirm_email.pending.check_later')}
              textSize="medium"
              textColor="muted"
              textBoldness="regular"
              onPress={onClose}
              disabled={loading}
              classes="self-center mt-1"
            />
          </View>
        </View>
      )}
      {status === Status.SENT && (
        <View className="flex-1 justify-between">
          <View className="flex-1 justify-center">
            <Badge icon="email-fast-outline" tint="rgba(250,187,91,0.14)" color={Colors.brand} />
            <CustomText size="title" boldness="bold" color="secondary" classes="text-center" numberOfLines={3}>
              {t('session.confirm_email.sent.title')}
            </CustomText>
          </View>
          <CustomTouchableOpacity
            type="support_primary"
            size="large"
            text={t('session.confirm_email.sent.close')}
            textSize="medium"
            textColor="on_brand"
            textBoldness="semiBold"
            onPress={onClose}
            disabled={loading}
          />
        </View>
      )}
      {status === Status.VERIFIED && (
        <View className="flex-1 justify-between">
          <View className="flex-1 justify-center">
            <Badge icon="check-circle-outline" tint="rgba(35,230,158,0.14)" color={Colors.success} />
            <CustomText size="title" boldness="bold" color="secondary" classes="text-center" numberOfLines={3}>
              {t('session.confirm_email.verified.title')}
            </CustomText>
          </View>
          <CustomTouchableOpacity
            type="support_primary"
            size="large"
            text={t('session.confirm_email.verified.close')}
            textSize="medium"
            textColor="on_brand"
            textBoldness="semiBold"
            onPress={onNext}
            disabled={loading}
          />
        </View>
      )}
      {status === Status.ERROR && (
        <View className="flex-1 justify-between">
          <View className="flex-1 justify-center">
            <Badge icon="alert-circle-outline" tint="rgba(255,90,95,0.14)" color={Colors.danger} />
            <CustomText size="title" boldness="bold" color="secondary" classes="text-center" numberOfLines={3}>
              {t('session.confirm_email.error.title')}
            </CustomText>
          </View>
          <CustomTouchableOpacity
            type="support_primary"
            size="large"
            text={t('session.confirm_email.error.close')}
            textSize="medium"
            textColor="on_brand"
            textBoldness="semiBold"
            onPress={onClose}
            disabled={loading}
          />
        </View>
      )}
    </ScrollView>
  )
}

export default EmailConfirmation