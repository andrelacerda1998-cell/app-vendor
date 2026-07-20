import BackHeader from '@/components/app/BackHeader';
import {CustomText} from "@/components/CustomText";
import CustomTextInput from "@/components/CustomTextInput";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import DatePicker from '@/components/DatePicker';
import {ThemedText} from '@/components/ThemedText';
import TouchOpacity from '@/components/TouchOpacity';
import {API_ROUTES} from '@/constants/ApiRoutes';
import {Colors} from '@/constants/Colors';
import {useApi} from '@/contexts/ApiContext';
import {useSession} from '@/contexts/SessionContext';
import {validateNIF} from "@/utils";
import {Feather, MaterialIcons, Octicons} from '@expo/vector-icons';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {router} from 'expo-router';
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Control, Controller, useForm} from 'react-hook-form';
import {View, StatusBar, Image, KeyboardAvoidingView, Platform, Alert, ImageBackground, TouchableOpacity, TouchableWithoutFeedback} from 'react-native';
import {ScrollView, TextInput} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {useDialog} from "@/contexts/DialogContext";
import CheckMark from "@/assets/icons/check-mark";
import XIcon from "@/assets/icons/x";
import {ImagePickerAsset} from "expo-image-picker/src/ImagePicker.types";
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

const EditCompanyAddress = () => {
    const { t } = useTranslation();
    const {api} = useApi();
    const {vendorData, setVendorData} = useSession();
    const {openDialog} = useDialog();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const {control, handleSubmit, formState: {errors, isLoading, isValid}, getValues, setError, reset} = useForm({
        mode: 'onChange',
        defaultValues: {
            at_user: vendorData?.at_user || '',
            at_password: '',
        },
    });
    const [updateError, setUpdateError] = useState(false);

    const handleGoBack = () => {
        if (router.canGoBack()) {
            return router.back();
        }
        return router.push("/(app)/(tabs)/profile");
    }

    const updateAtUser = () => {
        setLoading(true);
        api.post(API_ROUTES.POST_AT_USER, {
            at_user: getValues('at_user'),
            at_password: getValues('at_password'),
        })
            .then(() => {
                const newVendorData = {
                    ...vendorData,
                    at_user: getValues('at_user'),
                    at_valid: true,
                }
                setVendorData(newVendorData);
                openDialog({
                    icon: <CheckMark color={Colors.primary}/>,
                    title: t('profile.edit.at_user.update.title'),
                    subtitle: t('profile.edit.at_user.update.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                    onClose: () => {
                        handleGoBack();
                    }
                })
            })
            .catch(err => {
                console.log(err?.response?.data)
                const raw = err?.response?.data?.metadata?.message || err?.response?.data?.message || '';
                const message = /credenc|credential/i.test(raw)
                    ? t('profile.edit.at_user.wrong_credentials')
                    : (raw || t('errors.occurred_an_error'));
                setUpdateError(message);

                openDialog({
                    icon: <XIcon color={Colors.primary}/>,
                    title: t('errors.title'),
                    subtitle: message,
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
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
                updateAtUser();
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
                <View className="space-y-8 p-5 flex-1">

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.at_user')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="at_user"
                            rules={{
                                required: t('general.at_user_required'),
                                pattern: {
                                    value: /^\d{9}\/\d+$/,
                                    message: t('general.at_user_invalid'),
                                },
                                validate: (value) => {
                                    const nif = value.split('/')[0];
                                    if (!validateNIF(nif)) return t('general.at_user_invalid');
                                    return true;
                                },
                            }}
                            render={({ field }) => (
                                <View className="mt-2">
                                    <CustomTextInput
                                        {...field}
                                        size="large"
                                        keyboardType="number-pad"
                                        onChangeText={(value: string) => {
                                            if (updateError) setUpdateError(false);
                                            const digits = value.replace(/\D/g, '');
                                            const nif = digits.slice(0, 9);
                                            const sub = digits.slice(9);
                                            const masked = sub.length > 0 ? `${nif}/${sub}` : nif;
                                            field.onChange(masked);
                                        }}
                                        placeholder={t('general.at_user_placeholder')}
                                        error={errors.at_user && errors.at_user.message}
                                        displayErrorIcon={true}
                                        success={!errors.at_user && field.value}
                                        displaySuccessIcon={true}
                                    />
                                </View>
                            )}
                        />
                        {errors.at_user && errors.at_user.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"

                            >
                                {errors.at_user.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.at_password')}
                        </CustomText>

                        <Controller
                            control={control}
                            name="at_password"
                            defaultValue=""
                            rules={{
                                required: t('general.at_password_required'),
                            }}
                            render={({ field }) => (
                                <View className="mt-2 justify-center" removeClippedSubviews={true}>
                                    <CustomTextInput
                                        {...field}
                                        size="large"
                                        onChangeText={(value: string) => {
                                            if (updateError) setUpdateError(false);
                                            const filteredValue = value.replace(/\s/g, '');
                                            field.onChange(filteredValue);
                                        }}
                                        textContentType="at_password"
                                        placeholder={t('general.at_password_placeholder')}
                                        secureTextEntry={!showPassword}
                                        autoCorrect={false}
                                        contextMenuHidden={true}
                                        pointerEvents="box-only"
                                        error={errors.at_password && errors.at_password.message}
                                        success={!errors.at_password && field.value}
                                        Icon={() => (
                                            <View className="w-12 h-full items-center justify-center">
                                                <TouchableWithoutFeedback
                                                    onPress={() => setShowPassword(prev => !prev)}
                                                >
                                                    <View className="w-full h-full items-center justify-center">
                                                        <Feather name={showPassword ? 'eye' : 'eye-off'} size={24} color={Colors.secondary} />
                                                    </View>
                                                </TouchableWithoutFeedback>
                                            </View>
                                        )}
                                    />
                                    {errors.at_password && errors.at_password.message && (
                                        <CustomText
                                        size="small"
                                        color="error"
                                        classes="mt-1"
                                        >
                                        {errors.at_password.message as string}
                                        </CustomText>
                                    )}
                                </View>
                            )}
                        />
                        <CustomText size="small" color="gray_medium" classes="mt-2" numberOfLines={3}>
                            {t('general.at_password_helper')}
                        </CustomText>
                    </View>
                </View>
            </KeyboardAwareScrollView>
            <View className="pb-5 px-5">
                {updateError && (
                    <View className="py-2">
                        <CustomText size="small" color="error" boldness="semiBold" numberOfLines={2} className="text-center">
                            {updateError}
                        </CustomText>
                    </View>
                )}
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

export default EditCompanyAddress

