/**
 * Morada de onde sais para um servico AGENDADO.
 *
 * Nao e a morada da empresa, e nao e o sitio onde estas agora. Num servico
 * imediato a distancia sai do GPS; num agendado o GPS de hoje nao diz nada
 * sobre onde vais estar na quinta-feira, por isso a conta parte DESTA morada —
 * e e dela que sai a parcela da deslocacao no preco.
 *
 * Estava so nas definicoes de agendamentos. Quem nunca la entrasse ficava sem
 * ela, e o calculo caia na morada fiscal, que pode ser um escritorio de
 * contabilidade do outro lado do distrito.
 *
 * O formulario e o mesmo da morada de faturacao (autocomplete do Google, com
 * saida manual): e a mesma tarefa, e duas maneiras diferentes de pedir a mesma
 * coisa no mesmo registo so confundem.
 */
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

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

const ScheduleAddressStep = ({
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

  const { control, handleSubmit, formState: { errors }, getValues, setValue, watch } = useForm({
    mode: 'onChange',
    defaultValues: { street_name: '', street_number: '', postal_code: '', city: '' },
  });

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
    setManualAddress(!s.postal_code || !s.city);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const response: any = await api.post(API_ROUTES.VENDOR_SCHEDULE_ADDRESS, {
        street_name: getValues('street_name'),
        street_number: getValues('street_number'),
        postal_code: getValues('postal_code'),
        city: getValues('city'),
        country: 'Portugal',
      });
      const address = response?.data?.data?.address;
      const newVendorData = { ...vendorData, schedule_address: address?.name };
      setVendorData(newVendorData);
      onNext(newVendorData as VendorDataInterface);
    } catch {
      openDialog({
        icon: <XIcon color={Colors.primary} />,
        title: t('errors.address_save.title'),
        subtitle: t('errors.address_save.subtitle'),
        closeAfterMSeconds: 2500,
        closeOnClickOutside: true,
      });
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
          {t('complete_profile.schedule_address.title')}
        </CustomText>
        <CustomText color="muted" numberOfLines={3} classes="mt-2">
          {t('complete_profile.schedule_address.subtitle')}
        </CustomText>

        <View className="mt-7" style={{ gap: 20 }}>
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
                  disabled={loading}
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
                  disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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

export default ScheduleAddressStep;
