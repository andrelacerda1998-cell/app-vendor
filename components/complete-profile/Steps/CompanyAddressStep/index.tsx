/**
 * Morada de faturacao.
 *
 * Sao seis campos escritos a mao, num telemovel, muitas vezes na rua: era o
 * passo mais lento do onboarding e a origem das moradas erradas nas faturas.
 * Agora comeca por uma pesquisa que preenche tudo de uma vez; os campos
 * continuam la, editaveis, para corrigir o numero da porta ou para quando a
 * pesquisa nao encontrar a morada.
 *
 * "Pais" e "Distrito" sairam: a Piquet so opera em Portugal (o pais era um
 * campo desativado com "Portugal" escrito) e o distrito nao e exigido pelo
 * backend nem usado na fatura -- a localidade da fatura e a cidade.
 */
import { CustomText } from "@/components/CustomText";
import CustomTextInput from "@/components/CustomTextInput";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useDialog } from "@/contexts/DialogContext";
import XIcon from "@/assets/icons/x";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { VendorDataInterface } from "@/types/session";
import {
  AddressSuggestion,
  AddressSuggestionList,
  useAddressSuggestions,
} from "@/components/address/AddressAutocomplete";

/** Campo de texto com rotulo e erro por baixo — o padrao repetido deste ecra. */
const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
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

const CompanyAddressStep = ({
    onNext
}: {
    onNext: (data: VendorDataInterface) => void;
}) => {
    const { t } = useTranslation();
    const { api } = useApi();
    const { vendorData, setVendorData } = useSession();
    const { openDialog } = useDialog();
    const [loading, setLoading] = useState(false);
    const [loadingUpdateLocation, setLoadingUpdateLocation] = useState(false);
    const { control, handleSubmit, formState: { errors }, getValues, setValue, reset, watch } = useForm({
        mode: 'onChange',
        defaultValues: {
            street_name: "",
            street_number: "",
            postal_code: "",
            city: "",
        },
    });

    // As sugestões vêm do próprio campo da rua: escreve-se lá, a lista aparece
    // por baixo, e escolher preenche o resto. (Havia uma caixa de pesquisa
    // separada por cima — era escrever a rua duas vezes.)
    const streetText = watch('street_name');
    const suggestions = useAddressSuggestions(streetText);

    useEffect(() => {
        if (!vendorData?.company_address) {
            getAddress();
        }
    }, []);

    const getAddress = () => {
        setLoading(true);
        api.get(API_ROUTES.GET_COMPANY_ADDRESS)
            .then((response: any) => {
                if (!response.data.data) return;
                const address = response.data.data;
                reset({
                    street_name: address?.street_name ?? '',
                    street_number: address?.street_number ?? '',
                    postal_code: address?.postal_code ?? '',
                    city: address?.city ?? '',
                })
            })
            .catch(() => {
                openDialog({
                    icon: <XIcon color={Colors.primary}/>,
                    title: t('errors.address_load.title'),
                    subtitle: t('errors.address_load.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            })
            .finally(() => {
                setLoading(false);
            })
    }

    /**
     * Preenche o que a sugestao trouxer, sem apagar o que ja la esta: o Google
     * costuma nao devolver o numero da porta, e apagar um numero ja escrito
     * seria pior do que nao preencher nada.
     */
    const applySuggestion = (s: AddressSuggestion) => {
        // Calar as sugestões ANTES de escrever no campo: o setValue muda o
        // texto observado e, sem isto, a mudança reabria a própria lista.
        suggestions.dismiss();
        if (s.street_name) setValue('street_name', s.street_name, { shouldValidate: true });
        if (s.street_number) setValue('street_number', s.street_number, { shouldValidate: true });
        if (s.postal_code) setValue('postal_code', s.postal_code, { shouldValidate: true });
        if (s.city) setValue('city', s.city, { shouldValidate: true });
    };

    const updateCompanyAddress = () => {
        setLoadingUpdateLocation(true);
        api.post(API_ROUTES.POST_COMPANY_ADDRESS, {
            street_name: getValues('street_name'),
            street_number: getValues('street_number'),
            postal_code: getValues('postal_code'),
            city: getValues('city'),
            // Só operamos em Portugal; deixou de haver campo para isto.
            country: 'Portugal',
        })
            .then((response: any) => {
                const { address } = response.data.data;
                const newVendorData = {
                    ...vendorData,
                    company_address: address.name
                }
                setVendorData(newVendorData);
                onNext(newVendorData as VendorDataInterface);
            })
            .catch(() => {
                openDialog({
                    icon: <XIcon color={Colors.primary}/>,
                    title: t('errors.address_save.title'),
                    subtitle: t('errors.address_save.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            })
            .finally(() => {
                setLoadingUpdateLocation(false);
            })
    }

    return (
        <View className="flex-1">
            <KeyboardAwareScrollView
                bottomOffset={20}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
            >
                <CustomText size="title" color="secondary" boldness="bold" numberOfLines={2}>
                    {t('general.company_address')}
                </CustomText>
                <CustomText color="muted" classes="mt-2 mb-5" numberOfLines={3}>
                    {t('complete_profile.company_address.subtitle')}
                </CustomText>

                <View style={{ gap: 20 }}>
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
                                    displayErrorIcon={true}
                                    success={!errors.street_name && field.value}
                                    displaySuccessIcon={true}
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
                                    displayErrorIcon={true}
                                    success={!errors.street_number && field.value}
                                    displaySuccessIcon={true}
                                />
                            </Field>
                        )}
                    />

                    <Controller
                        control={control}
                        name="postal_code"
                        rules={{
                            required: t('general.postal_code_required'),
                            pattern: {
                                value: /^\d{4}-\d{3}$/,
                                message: t('general.postal_code_invalid_format'),
                            },
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
                                    displayErrorIcon={true}
                                    success={!errors.postal_code && field.value}
                                    displaySuccessIcon={true}
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
                                    displayErrorIcon={true}
                                    success={!errors.city && field.value}
                                    displaySuccessIcon={true}
                                />
                            </Field>
                        )}
                    />
                </View>
            </KeyboardAwareScrollView>

            <View className="pb-5 px-5">
                <CustomTouchableOpacity
                    size="large"
                    type="support_primary"
                    textColor="primary"
                    textBoldness="semiBold"
                    text={loadingUpdateLocation ? t('profile.edit.saving_changes') : t('general.continue')}
                    onPress={handleSubmit(updateCompanyAddress)}
                    disabled={loading || loadingUpdateLocation}
                />
            </View>
        </View>
    );
};

export default CompanyAddressStep;
