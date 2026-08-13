/**
 * Dados de faturacao — funde num so ecra o que eram dois passos: o acesso a AT
 * (subutilizador) e a morada de faturacao. Sao a mesma ideia para o tecnico
 * ("o que a Piquet precisa para emitir as tuas faturas"), e separa-los era um
 * toque a mais no registo. O IBAN fica de fora, no passo "Pagamento", porque e
 * outra coisa (onde recebes, nao como faturas).
 *
 * Uma so submissao: grava o acesso a AT e depois a morada. So avanca quando as
 * duas passam; se a morada falhar, o acesso a AT ja ficou gravado e uma nova
 * tentativa volta a envia-lo (e uma atualizacao, nao cria nada novo).
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
import {
  AddressSuggestion,
  AddressSuggestionList,
  useAddressSuggestions,
} from '@/components/address/AddressAutocomplete';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { useSession } from '@/contexts/SessionContext';
import XIcon from '@/assets/icons/x';
import { VendorDataInterface } from '@/types/session';
import { validateNIF } from '@/utils';

/** Campo com rotulo e erro por baixo — o padrao repetido do ecra. */
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

/** Cabecalho de secao dentro do ecra (AT / Morada). */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <CustomText color="muted" size="small" boldness="bold" classes="mt-8 mb-1">
    {String(children).toUpperCase()}
  </CustomText>
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

  const { control, handleSubmit, formState: { errors }, getValues, setValue, watch } = useForm({
    mode: 'onChange',
    defaultValues: {
      at_user: vendorData?.at_user || '',
      at_password: '',
      street_name: '',
      street_number: '',
      postal_code: '',
      city: '',
    },
  });

  // Sugestoes de morada agarradas ao campo da rua.
  const suggestions = useAddressSuggestions(watch('street_name'));
  const applySuggestion = (s: AddressSuggestion) => {
    suggestions.dismiss();
    if (s.street_name) setValue('street_name', s.street_name, { shouldValidate: true });
    if (s.street_number) setValue('street_number', s.street_number, { shouldValidate: true });
    if (s.postal_code) setValue('postal_code', s.postal_code, { shouldValidate: true });
    if (s.city) setValue('city', s.city, { shouldValidate: true });
  };

  const showError = (title: string, subtitle: string) => {
    openDialog({
      icon: <XIcon color={Colors.primary} />,
      title,
      subtitle,
      closeAfterMSeconds: 2500,
      closeOnClickOutside: true,
    });
  };

  const submitBilling = async () => {
    setLoading(true);
    try {
      // 1) Acesso a AT.
      await api.post(API_ROUTES.POST_AT_USER, {
        at_user: getValues('at_user'),
        at_password: getValues('at_password'),
      });
    } catch (err: any) {
      setLoading(false);
      return showError(
        t('errors.at_user_save.title'),
        err?.response?.data?.message || t('errors.at_user_save.subtitle'),
      );
    }

    try {
      // 2) Morada de faturacao. Só operamos em Portugal.
      const response: any = await api.post(API_ROUTES.POST_COMPANY_ADDRESS, {
        street_name: getValues('street_name'),
        street_number: getValues('street_number'),
        postal_code: getValues('postal_code'),
        city: getValues('city'),
        country: 'Portugal',
      });
      const address = response?.data?.data?.address;
      const newVendorData = {
        ...vendorData,
        at_user: getValues('at_user'),
        company_address: address?.name,
      };
      setVendorData(newVendorData);
      onNext(newVendorData as VendorDataInterface);
    } catch {
      // O acesso a AT ja ficou gravado; uma nova tentativa reenvia-o (update).
      showError(t('errors.address_save.title'), t('errors.address_save.subtitle'));
    } finally {
      setLoading(false);
    }
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
        <CustomText color="muted" numberOfLines={3} classes="mt-2">
          {t('complete_profile.billing.subtitle')}
        </CustomText>

        {/* ---- Acesso a AT ---- */}
        <SectionTitle>{t('complete_profile.billing.at_section')}</SectionTitle>
        <View className="mt-2">
          <AtSubuserHelp />
        </View>

        <View className="mt-6" style={{ gap: 20 }}>
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

        {/* ---- Morada de faturacao ---- */}
        <SectionTitle>{t('complete_profile.billing.address_section')}</SectionTitle>
        <View className="mt-2" style={{ gap: 20 }}>
          <Controller
            control={control}
            name="street_name"
            rules={{ required: t('general.street_name_required') }}
            render={({ field }) => (
              <Field label={t('general.street_name')} error={errors.street_name?.message as string}>
                <CustomTextInput
                  {...field}
                  size="large"
                  onChangeText={field.onChange}
                  placeholder={t('general.street_name_placeholder')}
                  autoCorrect={false}
                  error={errors.street_name && errors.street_name.message}
                  displayErrorIcon
                  success={!errors.street_name && field.value}
                  displaySuccessIcon
                />
                <AddressSuggestionList
                  results={suggestions.results}
                  failed={suggestions.failed}
                  showEmpty={suggestions.showEmpty}
                  onSelect={applySuggestion}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="street_number"
            rules={{ required: t('general.street_number_required') }}
            render={({ field }) => (
              <Field label={t('general.street_number')} error={errors.street_number?.message as string}>
                <CustomTextInput
                  {...field}
                  size="large"
                  onChangeText={field.onChange}
                  placeholder={t('general.street_number_placeholder')}
                  error={errors.street_number && errors.street_number.message}
                  displayErrorIcon
                  success={!errors.street_number && field.value}
                  displaySuccessIcon
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="postal_code"
            rules={{
              required: t('general.postal_code_required'),
              pattern: { value: /^\d{4}-\d{3}$/, message: t('general.postal_code_invalid_format') },
            }}
            render={({ field }) => (
              <Field label={t('general.postal_code')} error={errors.postal_code?.message as string}>
                <CustomTextInput
                  {...field}
                  size="large"
                  onChangeText={(value: string) => {
                    value = value.replace(/[^\d]/g, '');
                    field.onChange(value.replace(/(\d{4})(\d{1,3})/, '$1-$2'));
                  }}
                  maxLength={8}
                  placeholder={t('general.postal_code_placeholder')}
                  keyboardType="number-pad"
                  error={errors.postal_code && errors.postal_code.message}
                  displayErrorIcon
                  success={!errors.postal_code && field.value}
                  displaySuccessIcon
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="city"
            rules={{ required: t('general.city_required') }}
            render={({ field }) => (
              <Field label={t('general.city')} error={errors.city?.message as string}>
                <CustomTextInput
                  {...field}
                  size="large"
                  onChangeText={field.onChange}
                  placeholder={t('general.city_placeholder')}
                  error={errors.city && errors.city.message}
                  displayErrorIcon
                  success={!errors.city && field.value}
                  displaySuccessIcon
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
          onPress={handleSubmit(submitBilling)}
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
