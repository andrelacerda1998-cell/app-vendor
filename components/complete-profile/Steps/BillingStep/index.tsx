/**
 * Acesso à AT (subutilizador) — o que a Piquet precisa para emitir as tuas
 * faturas em teu nome. A morada de faturacao vive agora no passo do pagamento
 * (IBAN), por isso este passo trata so do acesso a AT.
 */
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TouchableWithoutFeedback, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomText } from '@/components/CustomText';
import CustomTextInput from '@/components/CustomTextInput';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import AtSubuserHelp from '@/components/at/AtSubuserHelp';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { useSession } from '@/contexts/SessionContext';
import XIcon from '@/assets/icons/x';
import { VendorDataInterface } from '@/types/session';
import { validateNIF } from '@/utils';

/** Campo com rotulo e erro por baixo. */
const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <View>
    <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
      {label}
    </CustomText>
    <View className="mt-2">{children}</View>
    {!!error && (
      <CustomText size="small" color="error" classes="mt-1" numberOfLines={2}>
        {error}
      </CustomText>
    )}
  </View>
);

const BillingStep = ({
  onNext,
  onSkip,
}: {
  onNext: (data: VendorDataInterface) => void;
  onSkip: () => void;
}) => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData, setVendorData } = useSession();
  const { openDialog } = useDialog();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors }, getValues } = useForm({
    mode: 'onChange',
    defaultValues: {
      at_user: vendorData?.at_user || '',
      at_password: '',
    },
  });

  const submitAt = () => {
    setLoading(true);
    api.post(API_ROUTES.POST_AT_USER, {
      at_user: getValues('at_user'),
      at_password: getValues('at_password'),
    })
      .then(() => {
        const newVendorData = { ...vendorData, at_user: getValues('at_user') };
        setVendorData(newVendorData);
        onNext(newVendorData as VendorDataInterface);
      })
      .catch((err: any) => {
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.at_user_save.title'),
          subtitle: err?.response?.data?.message || t('errors.at_user_save.subtitle'),
          closeAfterMSeconds: 2500,
          closeOnClickOutside: true,
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <View className="flex-1 p-5">
      <KeyboardAwareScrollView
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <CustomText size="title" color="secondary" boldness="bold" numberOfLines={2}>
          {t('complete_profile.billing.title')}
        </CustomText>
        <CustomText color="muted" numberOfLines={3} classes="mt-2 mb-5">
          {t('complete_profile.billing.subtitle')}
        </CustomText>

        <AtSubuserHelp />

        <View className="mt-7" style={{ gap: 20 }}>
          <Controller
            control={control}
            name="at_user"
            rules={{
              required: t('general.at_user_required'),
              pattern: { value: /^\d{9}\/\d+$/, message: t('general.at_user_invalid') },
              validate: (value) => (validateNIF(value.split('/')[0]) ? true : t('general.at_user_invalid')),
            }}
            render={({ field }) => (
              <Field label={t('general.at_user')} error={errors.at_user?.message as string}>
                <CustomTextInput
                  {...field}
                  size="large"
                  keyboardType="number-pad"
                  onChangeText={(value: string) => {
                    const digits = value.replace(/\D/g, '');
                    const nif = digits.slice(0, 9);
                    const sub = digits.slice(9);
                    field.onChange(sub.length > 0 ? `${nif}/${sub}` : nif);
                  }}
                  placeholder={t('general.at_user_placeholder')}
                  error={errors.at_user && errors.at_user.message}
                  displayErrorIcon
                  success={!errors.at_user && field.value}
                  displaySuccessIcon
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="at_password"
            defaultValue=""
            rules={{ required: t('general.at_password_required') }}
            render={({ field }) => (
              <Field label={t('general.at_password')} error={errors.at_password?.message as string}>
                <CustomTextInput
                  {...field}
                  size="large"
                  onChangeText={(value: string) => field.onChange(value.replace(/\s/g, ''))}
                  textContentType="password"
                  placeholder={t('general.at_password_placeholder')}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  contextMenuHidden
                  error={errors.at_password && errors.at_password.message}
                  success={!errors.at_password && field.value}
                  Icon={() => (
                    <View className="w-12 h-full items-center justify-center">
                      <TouchableWithoutFeedback
                        onPress={() => setShowPassword((prev) => !prev)}
                        accessibilityRole="button"
                        accessibilityLabel={t('general.toggle_password_visibility')}
                        accessibilityState={{ expanded: showPassword }}
                      >
                        <View className="w-full h-full items-center justify-center">
                          <Feather name={showPassword ? 'eye' : 'eye-off'} size={24} color={Colors.secondary} />
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  )}
                />
              </Field>
            )}
          />
        </View>
      </KeyboardAwareScrollView>

      <View className="pt-5">
        <CustomTouchableOpacity
          size="large"
          type="support_primary"
          textColor="primary"
          textBoldness="semiBold"
          text={loading ? t('profile.edit.saving_changes') : t('general.continue')}
          onPress={handleSubmit(submitAt)}
          disabled={loading}
        />
        {/* Criar o subutilizador obriga a sair da app; sem saida o registo
            trancava aqui. O que falta continua no aviso da Home. */}
        <CustomTouchableOpacity
          size="large"
          type="transparent"
          textColor="muted"
          textSize="medium"
          textBoldness="regular"
          text={t('complete_profile.later')}
          onPress={onSkip}
          disabled={loading}
          classes="self-center mt-1"
        />
      </View>
    </View>
  );
};

export default BillingStep;
