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
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import {ScrollView, TextInput} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDialog} from "@/contexts/DialogContext";
import CheckMark from "@/assets/icons/check-mark";
import XIcon from "@/assets/icons/x";
import {useTranslation} from "react-i18next";
import CurrencyInput from "react-native-currency-input";
import IBAN from 'iban';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

const EditPayment = () => {
    const {t} = useTranslation();
    const {api} = useApi();
    const {vendorData, setVendorData} = useSession();
    const {openDialog} = useDialog();
    const [loading, setLoading] = useState(false);

    const handleGoBack = () => {
        if (router.canGoBack()) {
            return router.back();
        }
        return router.push("/(app)/(tabs)/profile");
    }

    const {control, handleSubmit, formState: {errors, isLoading, isValid}, getValues, setError, reset} = useForm({
        mode: 'onChange',
        defaultValues: {
            iban: IBAN.printFormat(vendorData?.iban || ""),
            price_rate: vendorData?.price_rate || 0,
            company_name: vendorData?.company_name || "",
            // nif: vendorData?.nif || "",
        },
    });

    const updateProfile = () => {
        setLoading(true);

        const formData = new FormData();
        formData.append('iban', (getValues('iban').replaceAll(' ', '')));
        formData.append('price_rate', String(getValues('price_rate')));
        formData.append('company_name', getValues('company_name'));
        // formData.append('nif', getValues('nif'));
        // formData.append('company_name', getValues('company_name'));

        api.post(API_ROUTES.VENDOR_UPDATE_PAYMENT + '?_method=PUT', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
            },
            transformRequest: (data) => data,
            timeout: 30000
        })
            .then((response) => {
                const data = response.data.data;
                setVendorData({
                    ...vendorData,
                    iban: data.iban,
                    price_rate: data.price_rate,
                    company_name: data.company_name,
                });
                handleGoBack();
                openDialog({
                    icon: <CheckMark color={Colors.primary}/>,
                    title: t('profile.edit.success.title'),
                    subtitle: t('profile.edit.success.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            })
            .catch((error) => {
                const errors = error?.response?.data?.errors ?? {};
                Object.keys(errors).forEach((key: any) => {
                    setError(
                        key,
                        {type: 'manual', message: errors[key]}
                    );
                });
                // Falha sem erros de validação (rede/500): antes ficava em silêncio.
                if (Object.keys(errors).length === 0) {
                    openDialog({
                        icon: <XIcon color={Colors.primary}/>,
                        title: t('errors.payment_save.title'),
                        subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.payment_save.subtitle'),
                        closeAfterMSeconds: 2000,
                        closeOnClickOutside: true,
                    });
                }
            })
            .finally(() => {
                setLoading(false);
            })
    }


    const openSaveDialog = () => {
        openDialog({
            title: t('profile.edit.save.title'),
            subtitle: t('profile.edit.save.subtitle'),
            successButtonText: t('profile.edit.save.confirm'),
            cancelButtonText: t('profile.edit.save.cancel'),
            onSuccess: () => {
                updateProfile();
            },
        })
    }

    const goToChangeCompanyAddress = () => {
        router.push({
            pathname: '/(app)/(modals)/(profile)/edit-company-address',
        })
    }

    const goToChangeAtUser = () => {
        router.push({
            pathname: '/(app)/(modals)/(profile)/edit-at-user',
        })
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.primary }}>
            <BackHeader
                backButtonColor="secondary"
                middleItem={() => (
                    <CustomText color="secondary" boldness="medium" numberOfLines={1}>
                        {t('profile.edit.header')}
                    </CustomText>
                )}
                otherClasses="p-5"
            />
            <KeyboardAwareScrollView bottomOffset={20}>
                <View className="space-y-8 flex-1 p-5">
                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.iban')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="iban"
                            rules={{
                                required: t('general.iban_required'),
                                validate: (value) => {
                                    const isValid = IBAN.isValid(value);
                                    if (!isValid) return t('general.iban_invalid');
                                    return true;
                                },
                                maxLength: {value: 31, message: t('general.iban_max_length')},
                                minLength: {value: 31, message: t('general.iban_min_length')},
                            }}
                            render={({field}) => (
                                <View className="mt-2">
                                    <CustomTextInput
                                        {...field}
                                        size="large"
                                        onChangeText={(value: string) => {
                                            // Allow only uppercase letters, numbers, and spaces, and auto-insert spaces every 4 chars
                                            let cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                            let formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
                                            field.onChange(formatted);
                                        }}
                                        placeholder="PT12 3456 7891 2345 6789 1234 5"
                                        error={errors.iban && errors.iban.message}
                                        displayErrorIcon={true}
                                        success={!errors.iban && field.value}
                                        displaySuccessIcon={true}
                                        disabled={loading}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        autoComplete="iban"
                                        maxLength={31}
                                    />
                                </View>
                            )}
                        />
                        {errors.iban && errors.iban.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.iban.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.price_rate.title')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="price_rate"
                            rules={{
                                validate: (value) => {
                                if (!value) {
                                    return t('general.price_rate.required');
                                } else if (isNaN(value)) {
                                    return t('general.price_rate.must_be_number');
                                } else if (value < 1) {
                                    return t('general.price_rate.min_value');
                                } else if (value > 999999) {
                                    return t('general.price_rate.max_value');
                                }
                                return true;
                                }
                            }}
                            render={({ field }) => {
                                let numericValue = 0;
                                if (typeof field.value === 'number') {
                                    numericValue = field.value;
                                } else if (typeof field.value === 'string') {
                                    numericValue = Number((field.value as string).replace(/[^0-9.]/g, ''));
                                    if (isNaN(numericValue)) numericValue = 0;
                                }

                                return (
                                    <View className="relative justify-center mt-2">
                                        <CurrencyInput
                                            {...field}
                                            value={numericValue}
                                            onChangeValue={(value) => {
                                                field.onChange(value);
                                            }}
                                            renderTextInput={textInputProps => (
                                                <CustomTextInput
                                                    {...textInputProps}
                                                    size="large"
                                                    keyboardType="numeric"
                                                    placeholder={t('general.price_rate.placeholder')}
                                                    classes=""
                                                />
                                            )}
                                            prefix="€ "
                                            suffix=" / h"
                                            delimiter=" "
                                            separator=","
                                            precision={2}
                                        />
                                    </View>
                                )
                            }}
                            />
                            {errors.price_rate && errors.price_rate.message && (
                                <CustomText
                                    size="small"
                                    color="error"
                                    classes="mt-2"
                                    numberOfLines={3}
                                >
                                    {errors.price_rate.message as string}
                                </CustomText>
                            )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.company_name')}
                        </CustomText>

                        <Controller
                            control={control}
                            name="company_name"
                            rules={{
                                required: t('general.company_name_required'),
                            }}
                            render={({field}) => (
                                <View className="mt-2">
                                    <CustomTextInput
                                        {...field}
                                        size="large"
                                        onChangeText={(value: string) => {
                                            value = value.replace(/\s{2,}/g, ' ')
                                            field.onChange(value)
                                        }}
                                        autoCorrect={false}
                                        placeholder={t('general.company_name_placeholder')}
                                        error={errors.company_name && errors.company_name.message}
                                        displayErrorIcon={true}
                                        success={!errors.company_name && field.value}
                                        displaySuccessIcon={true}
                                        disabled={loading}
                                    />
                                </View>
                            )}
                        />
                        {errors.company_name && errors.company_name.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.company_name.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.company_address')}
                        </CustomText>
                        <CustomTouchableOpacity
                            size="large"
                            type="secondary_outline"
                            textColor="secondary"
                            textBoldness="semiBold"
                            text={t('general.company_address_change')}
                            classes="mt-2"
                            onPress={goToChangeCompanyAddress}
                            disabled={loading}
                        />
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.at_user')}
                        </CustomText>
                        <CustomTouchableOpacity
                            size="large"
                            type="secondary_outline"
                            textColor="secondary"
                            textBoldness="semiBold"
                            text={t('general.at_user_change')}
                            classes="mt-2"
                            onPress={goToChangeAtUser}
                            disabled={loading}
                        />
                    </View>

                    {/* <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.nif')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="nif"
                            rules={{
                                required: t('general.nif_required'),
                                pattern: {value: /^[0-9]{9}$/, message: t('general.nif_invalid')},
                                minLength: {value: 9, message: t('general.nif_min_length')},
                                validate: (value) => {
                                    const isValid = validateNIF(value)
                                    if (!isValid) return t('general.nif_invalid');
                                }
                            }}
                            render={({field}) => (
                                <View className="mt-2">
                                    <CustomTextInput
                                        {...field}
                                        size="large"
                                        onChangeText={(value: string) => {
                                            const newValue = value.replace(/\D/g, '').trim();
                                            field.onChange(newValue)
                                        }}
                                        placeholder={t('general.nif_placeholder')}
                                        keyboardType="number-pad"
                                        type="numeric"
                                        error={errors.nif && errors.nif.message}
                                        displayErrorIcon={true}
                                        success={!errors.nif && field.value}
                                        displaySuccessIcon={true}
                                        disabled={loading}
                                    />
                                </View>
                            )}
                        />
                        {errors.nif && errors.nif.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.nif.message as string}
                            </CustomText>
                        )}
                    </View> */}
                </View>
            </KeyboardAwareScrollView>
            <View className="p-5">
                <CustomTouchableOpacity
                    size="large"
                    type="support_primary"
                    textColor="primary"
                    textBoldness="semiBold"
                    text={loading ? t('profile.edit.saving_changes') : t('profile.edit.save_changes')}
                    onPress={handleSubmit(openSaveDialog)}
                    disabled={loading}
                />
            </View>
        </SafeAreaView>
    )
}

export default EditPayment

