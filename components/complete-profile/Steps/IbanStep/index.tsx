/**
 * Pagamento + morada de faturacao.
 *
 * O IBAN (onde recebes) e a morada de faturacao (o que sai nas faturas) vivem
 * no mesmo passo. Uma so submissao: grava o pagamento e depois a morada; se a
 * morada falhar, o IBAN ja ficou gravado e a nova tentativa reenvia-o (update).
 *
 * A morada nao se pede campo a campo: o autocomplete do Google traz rua, codigo
 * postal e cidade. So a rua e o numero da porta ficam sempre a vista; CP e
 * cidade aparecem como resumo confirmado, com saidas manuais para quando a
 * pesquisa nao encontra.
 */
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import IBAN from 'iban';

import { CustomText } from '@/components/CustomText';
import CustomTextInput from '@/components/CustomTextInput';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import {
  AddressSuggestion,
  AddressSuggestionList,
  useAddressSuggestions,
} from '@/components/address/AddressAutocomplete';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { useDialog } from '@/contexts/DialogContext';
import XIcon from '@/assets/icons/x';
import { VendorDataInterface } from '@/types/session';

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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <CustomText color="muted" size="small" boldness="bold" classes="mt-8 mb-1">
    {String(children).toUpperCase()}
  </CustomText>
);

const IbanStep = ({
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

  const { control, handleSubmit, formState: { errors }, getValues, setValue, setError, watch } = useForm({
    mode: 'onChange',
    defaultValues: {
      iban: vendorData?.iban || '',
      street_name: '',
      street_number: '',
      postal_code: '',
      city: '',
    },
  });

  // CP e cidade vêm da sugestao; so viram campos quando ha algo a corrigir.
  const [manualAddress, setManualAddress] = useState(false);
  const postal = watch('postal_code');
  const city = watch('city');
  const addressCaptured = !manualAddress && !!postal && !!city;

  const suggestions = useAddressSuggestions(watch('street_name'));
  const applySuggestion = (s: AddressSuggestion) => {
    suggestions.dismiss();
    if (s.street_name) setValue('street_name', s.street_name, { shouldValidate: true });
    if (s.street_number) setValue('street_number', s.street_number, { shouldValidate: true });
    if (s.postal_code) setValue('postal_code', s.postal_code, { shouldValidate: true });
    if (s.city) setValue('city', s.city, { shouldValidate: true });
    if (!s.postal_code || !s.city) setManualAddress(true);
    else setManualAddress(false);
  };

  const showError = (title: string, subtitle: string) => {
    openDialog({ icon: <XIcon color={Colors.primary} />, title, subtitle, closeAfterMSeconds: 2500, closeOnClickOutside: true });
  };

  const submit = async () => {
    setLoading(true);

    // 1) Pagamento (IBAN). O valor/hora já foi pedido no passo 3 do registo; o
    // backend exige-o na mesma, por isso reenviamos o que já está guardado.
    try {
      const formData = new FormData();
      formData.append('iban', getValues('iban').replaceAll(' ', ''));
      formData.append('price_rate', String(vendorData?.price_rate ?? 0));
      const res: any = await api.post(API_ROUTES.VENDOR_UPDATE_PAYMENT + '?_method=PUT', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
        transformRequest: (data) => data,
        timeout: 30000,
      });
      setVendorData({ ...vendorData, iban: res?.data?.data?.iban, price_rate: res?.data?.data?.price_rate, company_name: res?.data?.data?.company_name });
    } catch (error: any) {
      setLoading(false);
      const serverErrors = error?.response?.data?.errors ?? {};
      Object.keys(serverErrors).forEach((key: any) => setError(key, { type: 'manual', message: serverErrors[key] }));
      if (Object.keys(serverErrors).length === 0) showError(t('errors.title'), t('errors.occurred_an_error'));
      return;
    }

    // 2) Morada de faturacao. Só operamos em Portugal.
    try {
      const response: any = await api.post(API_ROUTES.POST_COMPANY_ADDRESS, {
        street_name: getValues('street_name'),
        street_number: getValues('street_number'),
        postal_code: getValues('postal_code'),
        city: getValues('city'),
        country: 'Portugal',
      });
      const address = response?.data?.data?.address;
      const newVendorData = { ...vendorData, iban: getValues('iban').replaceAll(' ', ''), company_address: address?.name };
      setVendorData(newVendorData);
      onNext(newVendorData as VendorDataInterface);
    } catch {
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
          {t('complete_profile.iban.title')}
        </CustomText>
        <CustomText color="muted" numberOfLines={3} classes="mt-2">
          {t('complete_profile.iban.subtitle')}
        </CustomText>

        {/* ---- IBAN ---- */}
        <View className="mt-7">
          <Controller
            control={control}
            name="iban"
            rules={{
              required: t('general.iban_required'),
              validate: (value) => (IBAN.isValid(value) ? true : t('general.iban_invalid')),
              maxLength: { value: 31, message: t('general.iban_max_length') },
              minLength: { value: 31, message: t('general.iban_min_length') },
            }}
            render={({ field }) => (
              <Field label={t('general.iban')} error={errors.iban?.message as string}>
                <CustomTextInput
                  {...field}
                  size="large"
                  onChangeText={(value: string) => {
                    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                    field.onChange(cleaned.replace(/(.{4})/g, '$1 ').trim());
                  }}
                  placeholder="PT12 3456 7891 2345 6789 1234 5"
                  error={errors.iban && errors.iban.message}
                  displayErrorIcon
                  success={!errors.iban && field.value}
                  displaySuccessIcon
                  disabled={loading}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="iban"
                  maxLength={31}
                />
              </Field>
            )}
          />
        </View>

        {/* ---- Morada de faturacao ---- */}
        <SectionTitle>{t('complete_profile.iban.address_section')}</SectionTitle>
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

          {addressCaptured ? (
            <View
              className="flex-row items-center rounded-2xl border px-4"
              style={{ borderColor: Colors.line, backgroundColor: Colors.card, minHeight: 60 }}
            >
              <Feather name="map-pin" size={18} color={Colors.muted} />
              <CustomText color="secondary" size="medium" boldness="semiBold" classes="flex-1 ml-3" numberOfLines={1}>
                {postal} · {city}
              </CustomText>
              <CustomTouchableOpacity
                type="transparent"
                size="small"
                text={t('complete_profile.iban.address_edit')}
                textSize="small"
                textColor="support_primary"
                textBoldness="bold"
                onPress={() => setManualAddress(true)}
              />
            </View>
          ) : (
            <CustomTouchableOpacity
              type="transparent"
              size="small"
              text={t('complete_profile.iban.address_manual')}
              textSize="small"
              textColor="support_primary"
              textBoldness="bold"
              onPress={() => setManualAddress(true)}
              classes="self-start"
            />
          )}

          <Controller
            control={control}
            name="postal_code"
            rules={{
              required: t('general.postal_code_required'),
              pattern: { value: /^\d{4}-\d{3}$/, message: t('general.postal_code_invalid_format') },
            }}
            render={({ field }) =>
              manualAddress ? (
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
              ) : <View />
            }
          />

          <Controller
            control={control}
            name="city"
            rules={{ required: t('general.city_required') }}
            render={({ field }) =>
              manualAddress ? (
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
              ) : <View />
            }
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
          onPress={handleSubmit(submit, () => setManualAddress(true))}
          disabled={loading}
        />
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

export default IbanStep;
