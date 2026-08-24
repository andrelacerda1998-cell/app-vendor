import BackHeader from '@/components/app/BackHeader';
import {CustomText} from "@/components/CustomText";
import CustomTextInput from "@/components/CustomTextInput";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import {ListCard} from "@/components/ui";
import {API_ROUTES} from '@/constants/ApiRoutes';
import {Colors} from '@/constants/Colors';
import {useApi} from '@/contexts/ApiContext';
import {useSession} from '@/contexts/SessionContext';
import { Feather } from '@expo/vector-icons';
import {router} from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View, ImageBackground, TouchableOpacity } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {useDialog} from "@/contexts/DialogContext";
import CheckMark from "@/assets/icons/check-mark";
import XIcon from "@/assets/icons/x";
import {ImagePickerAsset} from "expo-image-picker/src/ImagePicker.types";
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import IBAN from 'iban';

/** Normaliza o IBAN para comparação/envio: sem espaços e em maiúsculas. */
const normalizeIban = (value?: string | null) => (value ?? '').replace(/\s/g, '').toUpperCase();

const EditProfile = () => {
    const { t } = useTranslation();
    const {api} = useApi();
    const {vendorData, setVendorData} = useSession();
    const {openDialog} = useDialog();
    const [loading, setLoading] = useState(false);
    const [locationConsentStatus, setLocationConsentStatus] = useState<Location.PermissionStatus>();
    const [loadingUpdateLocation, setLoadingUpdateLocation] = useState(false);
    const [loadingResetPassword, setLoadingResetPassword] = useState(false);
    const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
    const [avatarError, setAvatarError] = useState<string|null>(null);

    useEffect(() => {
        async function askPermission() {
            let {status} = await Location.requestForegroundPermissionsAsync();
            setLocationConsentStatus(status);
            if (status !== 'granted') {
                // todo not have permission
                return;
            }
        }

        askPermission()
    }, []);

    const pickImage = async () => {
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.4,
            selectionLimit: 1,
          });

          if (!result.canceled && result.assets?.length) {
            setAsset(result.assets[0]);
          }
        } catch (error: any) {
          setAvatarError(error?.response?.data?.message)
        }
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            return router.back();
        }
        return router.push("/(app)/(tabs)/profile");
    }

    const initialIban = vendorData?.iban ? IBAN.printFormat(vendorData.iban) : "";

    const {control, handleSubmit, formState: {errors}, getValues, setError} = useForm({
        mode: 'onChange',
        defaultValues: {
            name: vendorData?.user.name || "",
            phone_number: vendorData?.user.phone_number.replace('-', '') || "",
            iban: initialIban,
        },
    });

    /**
     * Passo 1: dados pessoais.
     * `nif` e `date_birthday` deixaram de ser enviados de propósito — o NIF passou a ser
     * derivado do subutilizador da AT no backend e a data de nascimento não é usada.
     * O UserController::update só toca nesses campos quando a chave vem no pedido,
     * por isso não os enviar não os apaga.
     */
    const updateProfileRequest = () => {
        const newPhoneNumber = getValues('phone_number').startsWith('+351-')
            ? getValues('phone_number')
            : getValues('phone_number').replace('+351', '+351-');

        const formData = new FormData();
        formData.append('name', getValues('name'));
        formData.append('phone_number', newPhoneNumber);

        if (asset) {
            formData.append('avatar', {
                uri: asset.uri,
                name: asset.fileName || 'image.jpg',
                type: asset.mimeType || 'image/jpeg',
            } as any);
        }

        return api.post(API_ROUTES.AUTH_UPDATE_PROFILE + '?_method=PUT', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
            },
            transformRequest: (data) => data,
            timeout: 30000
        });
    }

    /**
     * Passo 2: IBAN, num endpoint próprio.
     * O UpdatePaymentRequest exige também `price_rate` e `company_name`; reenviamos os
     * valores atuais sem os mostrar, senão a validação falha ou os dados são apagados.
     */
    const updateIbanRequest = () => {
        const formData = new FormData();
        formData.append('iban', normalizeIban(getValues('iban')));
        formData.append('price_rate', String(vendorData?.price_rate ?? 0));
        formData.append('company_name', vendorData?.company_name ?? '');

        return api.post(API_ROUTES.VENDOR_UPDATE_PAYMENT + '?_method=PUT', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
            },
            transformRequest: (data) => data,
            timeout: 30000
        });
    }

    const applyValidationErrors = (error: any) => {
        const responseErrors = error?.response?.data?.errors ?? {};
        Object.keys(responseErrors).forEach((key: any) => {
            // O endpoint de pagamentos também pode devolver erros de campos que não
            // mostramos aqui (price_rate/company_name) — esses só vão para o diálogo.
            if (key === 'name' || key === 'phone_number' || key === 'iban') {
                setError(key, {type: 'manual', message: responseErrors[key]});
            }
        });
        return responseErrors;
    }

    const saveChanges = async () => {
        setLoading(true);

        // Fase 1 — perfil. Se falhar, não avançamos para o IBAN.
        let updatedVendor: any;
        try {
            const response = await updateProfileRequest();
            const newUserData = response.data.data;

            updatedVendor = {
                ...vendorData,
                user: {
                    ...newUserData,
                    name: getValues('name'),
                },
            };
            setVendorData(updatedVendor);
        } catch (error: any) {
            applyValidationErrors(error);
            openDialog({
                icon: <XIcon color={Colors.primary}/>,
                title: t('errors.profile_save.title'),
                subtitle: error?.response?.data?.metadata?.message
                    || error?.response?.data?.message
                    || t('errors.profile_save.subtitle'),
                closeAfterMSeconds: 3000,
                closeOnClickOutside: true,
            });
            setLoading(false);
            return;
        }

        // Fase 2 — IBAN, só se mudou.
        const ibanChanged = normalizeIban(getValues('iban')) !== normalizeIban(vendorData?.iban);

        if (ibanChanged) {
            try {
                const response = await updateIbanRequest();
                const data = response.data.data;
                setVendorData({
                    ...updatedVendor,
                    iban: data.iban,
                    price_rate: data.price_rate,
                    company_name: data.company_name,
                });
            } catch (error: any) {
                applyValidationErrors(error);
                // O perfil já foi guardado: dizemos exatamente o que passou para o
                // técnico não ficar sem saber o estado dos dados.
                openDialog({
                    icon: <XIcon color={Colors.primary}/>,
                    title: t('profile.edit.partial_save.title'),
                    subtitle: t('profile.edit.partial_save.subtitle'),
                    closeAfterMSeconds: 4000,
                    closeOnClickOutside: true,
                });
                setLoading(false);
                return;
            }
        }

        setLoading(false);
        handleGoBack();
        openDialog({
            icon: <CheckMark color={Colors.primary}/>,
            title: t('profile.edit.success.title'),
            subtitle: t('profile.edit.success.subtitle'),
            closeAfterMSeconds: 2000,
            closeOnClickOutside: true,
        });
    }

    const sendResetEmail = () => {
        setLoadingResetPassword(true);
        api.post(API_ROUTES.AUTH_LOGIN_FORGOT_PASSWORD, {
            email: vendorData?.user.email,
            type: 'vendor',
        })
            .then(() => {
                openDialog({
                    icon: <CheckMark color={Colors.primary}/>,
                    title: t('auth.forgot_password.email_sent.title'),
                    subtitle: t('auth.forgot_password.email_sent.subtitle_when_logged'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            })
            .catch(error => {
                if (error.response?.status === 500) {
                    openDialog({
                        icon: <XIcon color={Colors.primary}/>,
                        title: t('errors.reset_password_email.title'),
                        subtitle: t('errors.reset_password_email.subtitle'),
                        closeAfterMSeconds: 2000,
                        closeOnClickOutside: true,
                    })
                } else if (error.response?.status === 400) {
                    openDialog({
                        icon: <XIcon color={Colors.primary}/>,
                        title: t('errors.profile_save.title'),
                        subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.profile_save.subtitle'),
                        closeAfterMSeconds: 2000,
                        closeOnClickOutside: true,
                    })
                } else {
                    openDialog({
                        icon: <XIcon color={Colors.primary}/>,
                        title: t('errors.profile_save.title'),
                        subtitle: t('errors.profile_save.subtitle'),
                        closeAfterMSeconds: 2000,
                        closeOnClickOutside: true,
                    })
                }
            })
            .finally(() => {
                setLoadingResetPassword(false);
            });
    };

    const openSaveDialog = () => {
        openDialog({
            title: t('profile.edit.save.title'),
            subtitle: t('profile.edit.save.subtitle'),
            successButtonText: t('profile.edit.save.confirm'),
            cancelButtonText: t('profile.edit.save.cancel'),
            onSuccess: () => {
                saveChanges();
            },
        })
    }

    /**
     * A morada fiscal não é editável aqui de propósito: o AddressController::update
     * geocodifica pelo Google e substitui a morada toda, devolvendo 400 se o geocoding
     * falhar. Se ela vivesse neste formulário, guardar o nome ou o telefone podia falhar
     * por causa do Google — por isso é só uma linha de navegação para o ecrã dedicado.
     */
    const goToCompanyAddress = () => {
        router.push('/(app)/(modals)/(profile)/edit-company-address');
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: Colors.primary}}>
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
                <View className="flex-1 p-5 space-y-8">
                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.avatar')}
                        </CustomText>

                        <View className="relative w-32 h-32 mt-2 mx-auto">
                            {(asset?.uri || vendorData?.user?.avatar?.src) && (
                                <ImageBackground
                                    source={asset ? { uri: asset.uri } : { uri: vendorData?.user?.avatar?.src || "" }}
                                    className="w-full h-full bg-center rounded-full overflow-hidden bg-gray-200"
                                    imageStyle={{ borderRadius: 10 }}
                                />
                            )}

                            <View className="bg-gray_medium opacity-50 border-2 border-dashed border-secondary rounded-full h-full w-full absolute"></View>

                            <TouchableOpacity onPress={() => pickImage()} className="absolute h-full w-full items-center justify-center p-2 shadow-md">
                                <Feather name="camera" size={32} color={Colors.secondary} />
                            </TouchableOpacity>
                        </View>

                        {avatarError && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {avatarError}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.full_name')}
                        </CustomText>

                        <Controller
                            control={control}
                            name="name"
                            rules={{
                                required: t('general.full_name_required'),
                                minLength: { value: 2, message: t('general.full_name_min_length') },
                                validate: (value) => {
                                    if (value.length > 50) {
                                        return t('general.full_name_max_length');
                                    } else if (/[^a-zA-Z\sÀ-ÖØ-öø-ÿ]/.test(value)) {
                                        return t('general.full_name_invalid_characters');
                                    } else if (value.trim().length === 0) {
                                        return t('general.full_name_cannot_be_only_spaces');
                                    } else if (value.trim().split(/\s+/).length < 2 || value.trim().split(/\s+/).length > 2) {
                                        return t('general.full_name_first_and_last_name');
                                    }
                                    return true;
                                }
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
                                        placeholder={t('general.full_name_placeholder')}
                                        error={errors.name && errors.name.message}
                                        displayErrorIcon={true}
                                        success={!errors.name && field.value}
                                        displaySuccessIcon={true}
                                        disabled={loading}
                                    />
                                </View>
                            )}
                        />
                        {errors.name && errors.name.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.name.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.phone_number')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="phone_number"
                            rules={{
                                required: t('general.phone_number_required'),
                                validate: (value) => {
                                    if (!value || value.trim() === "" || value === "+351") {
                                        return t('general.phone_number_required');
                                    }
                                    if (!/^\+351\d{9}$/.test(value)) {
                                        return t('general.phone_number_invalid_portuguese');
                                    }
                                    return true;
                                },
                            }}
                            render={({field}) => (
                                <View className="mt-2 justify-center">
                                    <CustomTextInput
                                        {...field}
                                        size="large"
                                        onChangeText={(value: string) => {
                                            const newValue = value.replace(/^\+351-?|\D/g, '').trim();
                                            field.onChange(newValue ? `+351${newValue}` : '');
                                        }}
                                        placeholder={t('general.phone_number_placeholder')}
                                        keyboardType="phone-pad"
                                        textContentType="telephoneNumber"
                                        error={errors.phone_number && errors.phone_number.message}
                                        displayErrorIcon={true}
                                        success={!errors.phone_number && field.value !== "+351" && field.value !== ""}
                                        displaySuccessIcon={true}
                                        disabled={loading}
                                    />
                                </View>
                            )}
                        />
                        {errors.phone_number && errors.phone_number.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.phone_number.message as string}
                            </CustomText>
                        )}
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
                                            // Só letras/números, em maiúsculas, com espaço a cada 4 caracteres.
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
                            {t('profile.payments.company_address')}
                        </CustomText>
                        <View className="mt-2">
                            {/* A morada é o texto principal da linha, não um valor
                                ao lado de uma etiqueta que repete o título da secção
                                — assim cabe inteira em vez de cortar em "Morada…". */}
                            <ListCard
                                items={[
                                    {
                                        key: 'company_address',
                                        label: vendorData?.company_address || t('profile.payments.empty_company_address'),
                                        onPress: goToCompanyAddress,
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('profile.edit.reset_password')}
                        </CustomText>
                        <CustomTouchableOpacity
                            size="large"
                            type="secondary_outline"
                            textColor="secondary"
                            textBoldness="semiBold"
                            text={loadingResetPassword ? t('profile.edit.sending_reset_email') : t('profile.edit.send_reset_email')}
                            classes="mt-2"
                            onPress={sendResetEmail}
                            disabled={loading || loadingUpdateLocation || loadingResetPassword}
                        />
                    </View>
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
                    disabled={loading || loadingUpdateLocation || loadingResetPassword}
                />
            </View>
        </SafeAreaView>
    )
}

export default EditProfile
