/**
 * Fecho do onboarding.
 *
 * Antes, o último passo terminava e a app simplesmente voltava à Home — o
 * técnico ficava sem saber se acabou, quanto tempo espera, ou como vai saber
 * que foi aprovado. Este ecrã diz as três coisas (padrão vindo do wizard
 * Flutter de referência, que fechava com "24–48h + aviso por notificação").
 */
import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Card } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { useSession } from '@/contexts/SessionContext';

const OnboardingSuccess = () => {
  const { t } = useTranslation();
  const { vendorData } = useSession();

  // Com a reordenação, qualquer passo pode ficar por fazer (tudo é saltável).
  // O fecho tem de ser honesto: "concluído" só quando está mesmo tudo; senão
  // "estás quase", para não dizer que acabou com coisas em falta.
  const missingDocs = vendorData?.missing_documents?.length ?? 0;
  const pending =
    missingDocs > 0 ||
    !vendorData?.user?.phone_number_verified_at ||
    !vendorData?.user?.email_verified_at ||
    !vendorData?.at_user ||
    !vendorData?.company_address ||
    !vendorData?.iban;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
      >
        <View className="items-center mb-8">
          <View
            className="items-center justify-center rounded-full mb-5"
            style={{ width: 88, height: 88, backgroundColor: pending ? 'rgba(233,162,59,0.16)' : 'rgba(35,230,158,0.14)' }}
          >
            <Feather
              name={pending ? 'clock' : 'check-circle'}
              size={44}
              color={pending ? Colors.warning : Colors.success}
            />
          </View>
          <CustomText size="title" color="secondary" boldness="bolder" classes="text-center">
            {t(pending ? 'onboarding_success.title_pending' : 'onboarding_success.title')}
          </CustomText>
          <CustomText size="medium" color="muted" classes="text-center mt-2 px-4" numberOfLines={4}>
            {t(pending ? 'onboarding_success.subtitle_pending' : 'onboarding_success.subtitle')}
          </CustomText>
        </View>

        {/* O que acontece a seguir */}
        <Card>
          {[
            { icon: 'search' as const, key: 'review' },
            { icon: 'bell' as const, key: 'notify' },
            { icon: 'zap' as const, key: 'start' },
          ].map((step, index) => (
            <View
              key={step.key}
              className="flex-row items-start"
              style={{ marginBottom: index === 2 ? 0 : 16 }}
            >
              <View
                className="items-center justify-center rounded-full mr-3"
                style={{ width: 36, height: 36, backgroundColor: Colors.card_high }}
              >
                <Feather name={step.icon} size={16} color={Colors.brand} />
              </View>
              <View className="flex-1">
                <CustomText color="secondary" size="medium" boldness="semiBold" numberOfLines={2}>
                  {t(`onboarding_success.steps.${step.key}.title`)}
                </CustomText>
                <CustomText color="muted" size="small" classes="mt-0.5" numberOfLines={3}>
                  {t(`onboarding_success.steps.${step.key}.subtitle`)}
                </CustomText>
              </View>
            </View>
          ))}
        </Card>

        {/* O que falta — documentos em concreto, ou uma nota genérica quando
            faltam outros passos (contactos, AT, IBAN, morada). */}
        {pending && (
          <Card
            className="flex-row items-center mt-3"
            style={{ borderColor: 'rgba(233,162,59,0.5)' }}
          >
            <Feather name="alert-triangle" size={20} color={Colors.warning} />
            <CustomText color="secondary" size="small" classes="flex-1 ml-3" numberOfLines={3}>
              {missingDocs > 0
                ? t('onboarding_success.missing_docs', { count: missingDocs })
                : t('onboarding_success.missing_generic')}
            </CustomText>
          </Card>
        )}

        <CustomTouchableOpacity
          type="support_primary"
          size="large"
          text={t('onboarding_success.cta')}
          textSize="medium"
          textColor="on_brand"
          textBoldness="bold"
          onPress={() => router.replace('/(app)/(tabs)/home')}
          classes="mt-6"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default OnboardingSuccess;
