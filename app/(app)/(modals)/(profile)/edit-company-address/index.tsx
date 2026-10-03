import BackHeader from '@/components/app/BackHeader';
import {CustomText} from "@/components/CustomText";
import CustomTextInput from "@/components/CustomTextInput";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import {API_ROUTES} from '@/constants/ApiRoutes';
import {Colors} from '@/constants/Colors';
import {useApi} from '@/contexts/ApiContext';
import {useSession} from '@/contexts/SessionContext';
import {Feather, MaterialIcons, Octicons} from '@expo/vector-icons';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {router} from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import {ScrollView, TextInput} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDialog} from "@/contexts/DialogContext";
import CheckMark from "@/assets/icons/check-mark";
import XIcon from "@/assets/icons/x";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
    AddressSuggestion,
    AddressSuggestionList,
    useAddressSuggestions,
} from '@/components/address/AddressAutocomplete';

const EditCompanyAddress = () => {
    const { t } = useTranslation();
    const {api} = useApi();
    const {vendorData, setVendorData} = useSession();
    const {openDialog} = useDialog();
    const [loading, setLoading] = useState(false);
    const [loadingUpdateLocation, setLoadingUpdateLocation] = useState(false);
    /**
     * Sem DISTRITO e sem PAÍS.
     *
     * O distrito aparecia rotulado "Localidade" e era obrigatório: o técnico
     * preenchia Cidade e depois Localidade sem perceber a diferença, e a segunda
     * ia parar à coluna do distrito. O país era um campo desactivado a dizer
     * "Portugal". Só operamos em Portugal -- o onboarding (IbanStep) já manda
     * `country: 'Portugal'` fixo e nunca pediu distrito, e o backend aceita os
     * dois em branco.
     */
    const {control, handleSubmit, formState: {errors, isLoading, isValid}, getValues, setError, reset, setValue, watch} = useForm({
        mode: 'onChange',
        defaultValues: {
            street_name: "",
            street_number: "",
            postal_code: "",
            city: "",
        },
    });

    /**
     * Autocomplete da morada, o mesmo do onboarding: escreve-se a rua e as
     * sugestões trazem número, código postal e cidade. Este ecrã era o único
     * onde a morada de faturação se escrevia toda à mão.
     */
    const suggestions = useAddressSuggestions(watch('street_name'));
    const applySuggestion = (sugestao: AddressSuggestion) => {
        suggestions.dismiss();
        if (sugestao.street_name) setValue('street_name', sugestao.street_name, { shouldValidate: true });
        if (sugestao.street_number) setValue('street_number', sugestao.street_number, { shouldValidate: true });
        if (sugestao.postal_code) setValue('postal_code', sugestao.postal_code, { shouldValidate: true });
        if (sugestao.city) setValue('city', sugestao.city, { shouldValidate: true });
    };

    useEffect(() => {
        getAddress();
    }, []);

    const getAddress = () => {
        setLoading(true);
        api.get(API_ROUTES.GET_COMPANY_ADDRESS)
            .then((response) => {
                if (!response.data.data) return;
                const address = response.data.data;
                reset({
                    street_name: address?.street_name,
                    street_number: address?.street_number,
                    postal_code: address?.postal_code,
                    city: address?.city,
                })
            })
            .catch((error) => {
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

    const handleGoBack = () => {
        if (router.canGoBack()) {
            return router.back();
        }
        return router.push("/(app)/(tabs)/profile");
    }

    const updateCompanyAddress = () => {
        setLoadingUpdateLocation(true);
        api.post(API_ROUTES.POST_COMPANY_ADDRESS, {
            street_name: getValues('street_name'),
            street_number: getValues('street_number'),
            postal_code: getValues('postal_code'),
            city: getValues('city'),
            country: 'Portugal',
        })
            .then((response) => {
                const { address } = response.data.data;
                const newVendorData = {
                    ...vendorData,
                    company_address: address.name
                }
                setVendorData(newVendorData);
                openDialog({
                    icon: <CheckMark color={Colors.primary}/>,
                    title: t('profile.edit.update_location_success.title'),
                    subtitle: t('profile.edit.update_location_success.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                    onClose: () => {
                        handleGoBack();
                    }
                })
            })
            .catch(err => {
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

    const openSaveDialog = () => {
        openDialog({
            title: t('profile.edit.save.title'),
            subtitle: t('profile.edit.save.subtitle'),
            successButtonText: t('profile.edit.save.confirm'),
            cancelButtonText: t('profile.edit.save.cancel'),
            onSuccess: () => {
                updateCompanyAddress();
            },
        })
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: Colors.primary}}>
            <BackHeader
                backButtonColor="secondary"
                middleItem={() => (
                    <CustomText color="secondary" boldness="medium" numberOfLines={1}>
                        {t('general.company_address_change')}
                    </CustomText>
                )}
                otherClasses="p-5"
            />
            <KeyboardAwareScrollView bottomOffset={20}>
                {/* Um só espaçamento, igual ao onboarding. Tinha `gap-y-8` aqui E
                    `mt-8` em cada campo: 64px entre campos, mais do triplo dos 20 do onboarding. */}
                <View className="flex-1 p-5" style={{ gap: 20 }}>
                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.street_name')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="street_name"
                            rules={{
                                required: t('general.street_name_required'),
                            }}
                            render={({ field }) => (
                                <View className="mt-2">
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
                                </View>
                            )}
                        />
                        {errors.street_name && errors.street_name.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"

                            >
                                {errors.street_name.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.street_number')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="street_number"
                            render={({ field }) => (
                                <View className="mt-2">
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
                                </View>
                            )}
                        />
                        {errors.street_number && errors.street_number.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                            {errors.street_number.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold">
                            {t('general.postal_code')}
                        </CustomText>

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
                                <View className="mt-2">
                                    <CustomTextInput
                                        {...field}
                                        size="large"
                                        onChangeText={(value: string) => {
                                            value = value.replace(/\s{2,}/g, ' ').replace(/[^\d]/g, '');
                                            if (value.endsWith('-')) {
                                                value = value.slice(0, -1)
                                            } else {
                                                value = value.replace(/(\d{4})(\d{1})/, '$1-$2')
                                            }
                                            field.onChange(value)
                                        }}
                                        maxLength={8}
                                        placeholder={t('general.postal_code_placeholder')}
                                        keyboardType="number-pad"
                                        error={errors.postal_code && errors.postal_code.message}
                                        displayErrorIcon={true}
                                        success={!errors.postal_code && field.value}
                                        displaySuccessIcon={true}
                                    />
                                </View>
                            )}
                        />
                        {errors.postal_code && errors.postal_code.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.postal_code.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold">
                            {t('general.city')}
                        </CustomText>

                        <Controller
                            control={control}
                            name="city"
                            rules={{
                                required: t('general.city_required'),
                            }}
                            render={({ field }) => (
                                <View className="mt-2">
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
                                </View>
                            )}
                        />
                        {errors.city && errors.city.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.city.message as string}
                            </CustomText>
                        )}
                    </View>

                </View>
            </KeyboardAwareScrollView>
            <View className="pb-5 px-5">
                <CustomTouchableOpacity
                    size="large"
                    type="support_primary"
                    textColor="primary"
                    textBoldness="semiBold"
                    text={loadingUpdateLocation ? t('profile.edit.saving_changes') : t('profile.edit.save_changes')}
                    onPress={handleSubmit(openSaveDialog)}
                    disabled={loading || loadingUpdateLocation}
                />
            </View>
        </SafeAreaView>
    )
}

export default EditCompanyAddress

