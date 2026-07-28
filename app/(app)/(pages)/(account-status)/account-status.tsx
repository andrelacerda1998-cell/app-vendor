/**
 * ESTADO DA CONTA — mostra em que ponto do onboarding o técnico está,
 * com os próximos passos e um atalho para os documentos.
 */
import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Card, SectionHeader } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { useSession } from '@/contexts/SessionContext';

/** Converte um hex em rgba com opacidade — usado para tingir o círculo do hero. */
const tint = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const AccountStatus = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { vendorData } = useSession();

  const approved = vendorData?.can_accept_service === true;
  const submitted = (vendorData?.pending_documents?.length ?? 0) > 0;
  const underReview = !approved && submitted;

  const heroColor = approved ? Colors.success : Colors.warning;
  const heroLabel = approved
    ? t('account_status.approved_label')
    : underReview
      ? t('account_status.review_label')
      : t('account_status.onboarding_label');
  const heroMessage = approved
    ? t('account_status.approved_message')
    : underReview
      ? t('account_status.review_message')
      : t('account_status.onboarding_message');

  // A conta de faturação é criada pela equipa Piquet no backoffice — o técnico
  // não tem como a criar. Sem este passo não consegue ficar online, por isso
  // aparece na lista com a nota de que não depende dele.
  const billingReady = (vendorData as any)?.invoice_workspace_ready === true;

  const steps: { label: string; done: boolean; hint?: string }[] = [
    { label: t('account_status.step_create_account'), done: true },
    { label: t('account_status.step_submit_documents'), done: submitted || approved },
    {
      label: t('account_status.step_billing'),
      done: billingReady,
      hint: billingReady ? undefined : t('account_status.step_billing_hint'),
    },
    { label: t('account_status.step_review'), done: approved },
    { label: t('account_status.step_approved'), done: approved },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('account_status.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <Card className="items-center py-6">
          <View
            className="items-center justify-center rounded-full mb-4"
            style={{ width: 80, height: 80, backgroundColor: tint(heroColor, 0.14) }}
          >
            {approved ? (
              <Ionicons name="shield-checkmark" size={40} color={heroColor} />
            ) : underReview ? (
              <Ionicons name="hourglass" size={40} color={heroColor} />
            ) : (
              <Feather name="clipboard" size={40} color={heroColor} />
            )}
          </View>

          <CustomText color="secondary" size="large" boldness="bold" classes="text-center">
            {heroLabel}
          </CustomText>
          <CustomText color="muted" size="small" classes="text-center mt-2" numberOfLines={4}>
            {heroMessage}
          </CustomText>
        </Card>

        <View className="mt-6">
          <SectionHeader title={t('account_status.steps_title')} />
          <Card>
            {steps.map((step, index) => (
              <View
                key={step.label}
                className="flex-row items-start"
                style={{ marginBottom: index === steps.length - 1 ? 0 : 14 }}
              >
                <Ionicons
                  name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={step.done ? Colors.success : Colors.muted}
                />
                <View className="ml-3 flex-1">
                  <CustomText
                    color={step.done ? 'secondary' : 'muted'}
                    size="small"
                    boldness="semiBold"
                    numberOfLines={2}
                  >
                    {step.label}
                  </CustomText>
                  {!!step.hint && (
                    <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={3}>
                      {step.hint}
                    </CustomText>
                  )}
                </View>
              </View>
            ))}
          </Card>
        </View>

        {!approved && (
          <CustomTouchableOpacity
            type="support_primary"
            size="large"
            classes="mt-6"
            text={t('account_status.see_documents')}
            textSize="medium"
            textColor="on_brand"
            textBoldness="bold"
            onPress={() => router.push('/(app)/(pages)/(mydocuments)/mydocuments')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountStatus;
