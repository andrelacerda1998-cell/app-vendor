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

  // Documentos saltados durante o onboarding: lembrar aqui, enquanto o
  // contexto ainda é "estou a acabar o registo", evita a surpresa de mais
  // tarde não perceber porque não fica aprovado.
  const missingDocs = vendorData?.missing_documents?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
      >
        <View className="items-center mb-8">
          <View
            className="items-center justify-center rounded-full mb-5"
            style={{ width: 88, height: 88, backgroundColor: 'rgba(35,230,158,0.14)' }}
          >
            <Feather name="check-circle" size={44} color={Colors.success} />
          </View>
          <CustomText size="title" color="secondary" boldness="bolder" classes="text-center">
            {t('onboarding_success.title')}
          </CustomText>
          <CustomText size="medium" color="muted" classes="text-center mt-2 px-4" numberOfLines={4}>
            {t('onboarding_success.subtitle')}
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

        {/* Documentos em falta — só quando é verdade */}
        {missingDocs > 0 && (
          <Card
            className="flex-row items-center mt-3"
            style={{ borderColor: 'rgba(233,162,59,0.5)' }}
          >
            <Feather name="alert-triangle" size={20} color={Colors.warning} />
            <CustomText color="secondary" size="small" classes="flex-1 ml-3" numberOfLines={3}>
              {t('onboarding_success.missing_docs', { count: missingDocs })}
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
