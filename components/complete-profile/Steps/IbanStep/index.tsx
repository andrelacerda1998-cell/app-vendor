import {CustomText} from "@/components/CustomText";
import CustomTextInput from "@/components/CustomTextInput";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import {API_ROUTES} from '@/constants/ApiRoutes';
import {useApi} from '@/contexts/ApiContext';
import {useSession} from '@/contexts/SessionContext';
import {Feather, MaterialIcons, Octicons} from '@expo/vector-icons';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import {ScrollView, TextInput} from 'react-native-gesture-handler';
import {useDialog} from "@/contexts/DialogContext";
import {useTranslation} from "react-i18next";
import IBAN from 'iban';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { VendorDataInterface } from "@/types/session";

const IbanStep = ({
  onNext
}: {
  onNext: (data: VendorDataInterface) => void;
}) => {
  const {t} = useTranslation();
    const {api} = useApi();
    const {vendorData, setVendorData} = useSession();
    const {openDialog} = useDialog();
    const [loading, setLoading] = useState(false);

    const {control, handleSubmit, formState: {errors, isLoading, isValid}, getValues, setError, reset} = useForm({
        mode: 'onChange',
        defaultValues: {
            iban: vendorData?.iban || "",
            company_name: vendorData?.company_name || "",
            // nif: vendorData?.nif || "",
        },
    });

    const updateProfile = () => {
        setLoading(true);

        const formData = new FormData();
        formData.append('iban', (getValues('iban').replaceAll(' ', '')));
        // O valor/hora já foi pedido no passo 3 do registo — não voltamos a pedi-lo aqui.
        // O backend (UpdatePaymentRequest) continua a exigir o campo, por isso enviamos
        // o valor já guardado sem o mostrar.
        formData.append('price_rate', String(vendorData?.price_rate ?? 0));
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
              // openDialog({
              //   icon: <CheckMark color={Colors.primary}/>,
              //   title: t('profile.edit.success.title'),
              //   subtitle: t('profile.edit.success.subtitle'),
              //   closeAfterMSeconds: 2000,
              //   closeOnClickOutside: true,
              //   onClose: () => {
              //   },
              // })
              onNext({
                ...vendorData,
                iban: data.iban,
                price_rate: data.price_rate,
                company_name: data.company_name,
              } as VendorDataInterface);
            })
            .catch((error) => {
                const errors = error?.response?.data?.errors ?? {};
                Object.keys(errors).forEach((key: any) => {
                    setError(
                        key,
                        {type: 'manual', message: errors[key]}
                    );
                });
            })
            .finally(() => {
                setLoading(false);
            })
    }


    // const openSaveDialog = () => {
    //     openDialog({
    //         title: t('profile.edit.save.title'),
    //         subtitle: t('profile.edit.save.subtitle'),
    //         successButtonText: t('profile.edit.save.confirm'),
    //         cancelButtonText: t('profile.edit.save.cancel'),
    //         onSuccess: () => {
    //             updateProfile();
    //         },
    //     })
    // }

  return (
    <View className="flex-1 p-5">
      <KeyboardAwareScrollView bottomOffset={20}>
        <View className="space-y-8 flex-1">
            <View>
                <CustomText size="subtitle" color="secondary" boldness="bolder" numberOfLines={2}>
                    {t('complete_profile.iban.title')}
                </CustomText>
                <CustomText color="muted" numberOfLines={4} classes="mt-1">
                    {t('complete_profile.iban.subtitle')}
                </CustomText>
            </View>

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
                    {t('general.company_name')}
                </CustomText>
                <CustomText color="muted" size="small" numberOfLines={4} classes="mt-1">
                    {t('complete_profile.iban.company_name_help')}
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
        </View>
      </KeyboardAwareScrollView>
      <View className="pt-5">
          <CustomTouchableOpacity
              size="large"
              type="support_primary"
              textColor="primary"
              textBoldness="semiBold"
              text={loading ? t('profile.edit.saving_changes') : t('profile.edit.save_changes')}
              onPress={handleSubmit(updateProfile)}
              disabled={loading}
          />
      </View>
    </View>
  )
}

export default IbanStep;