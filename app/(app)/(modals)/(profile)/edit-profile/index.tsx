import BackHeader from '@/components/app/BackHeader';
import {CustomText} from "@/components/CustomText";
import CustomTextInput from "@/components/CustomTextInput";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import DatePicker from '@/components/DatePicker';
import TouchOpacity from '@/components/TouchOpacity';
import {API_ROUTES} from '@/constants/ApiRoutes';
import {Colors} from '@/constants/Colors';
import {useApi} from '@/contexts/ApiContext';
import {useSession} from '@/contexts/SessionContext';
import { validateNIF } from "@/utils";
import {parseValidDate, defaultBirthDate} from "@/utils/date";
import { Feather } from '@expo/vector-icons';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {router} from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View, Platform, ImageBackground, TouchableOpacity } from 'react-native';
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
import { Picker } from "@react-native-picker/picker";
import { useActionSheet } from "@expo/react-native-action-sheet";

const EditProfile = () => {
    const { t } = useTranslation();
    const {api} = useApi();
    const {vendorData, setVendorData, getAvailableGenders, availableGenders} = useSession();
    const {openDialog} = useDialog();
    const { showActionSheetWithOptions } = useActionSheet();
    const [loading, setLoading] = useState(false);
    const [locationConsentStatus, setLocationConsentStatus] = useState<Location.PermissionStatus>();
    const [loadingUpdateLocation, setLoadingUpdateLocation] = useState(false);
    const [loadingResetPassword, setLoadingResetPassword] = useState(false);
    const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
    const [avatarError, setAvatarError] = useState<string|null>(null);

    useEffect(() => {

        if (availableGenders === null || availableGenders.length === 0) {
            getAvailableGenders();
        }

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
            // presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
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

    const {control, handleSubmit, formState: {errors, isLoading, isValid}, getValues, setError, reset} = useForm({
        mode: 'onChange',
        defaultValues: {
            name: vendorData?.user.name || "",
            date_birthday: parseValidDate(vendorData?.user.date_birthday) ?? defaultBirthDate(),
            nif: vendorData?.user.nif || "",
            phone_number: vendorData?.user.phone_number.replace('-', '') || "",
            gender_id: Number(vendorData?.user?.gender_id) || 0,
            // address: vendorData?.user?.address || `${vendorData?.current_location?.latitude}, ${vendorData?.current_location?.longitude}` || "",
        },
    });

    const updateProfile = () => {
        setLoading(true);
        const newPhoneNumber = getValues('phone_number').startsWith('+351-') ? getValues('phone_number') : getValues('phone_number').replace('+351', '+351-');

        const formData = new FormData();
        formData.append('name', getValues('name'));
        const birthday = parseValidDate(getValues('date_birthday') as Date) ?? defaultBirthDate();
        formData.append('date_birthday', birthday.toISOString().split('T')[0]);
        formData.append('nif', getValues('nif'));
        formData.append('phone_number', newPhoneNumber);
        formData.append('gender_id', String(getValues('gender_id') || '1'));

        if (asset) {
            formData.append('avatar', {
                uri: asset.uri,
                name: asset.fileName || 'image.jpg',
                type: asset.mimeType || 'image/jpeg',
            } as any);
        }

        api.post(API_ROUTES.AUTH_UPDATE_PROFILE + '?_method=PUT', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
            },
            transformRequest: (data) => data,
            timeout: 30000
        })
            .then((response) => {
                const newUserData = response.data.data;

                setVendorData({
                    ...vendorData,
                    user: {
                        ...newUserData,
                        name: getValues('name'),
                    },
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
            })
            .finally(() => {
                setLoading(false);
            })
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
                updateProfile();
            },
        })
    }

    const handlePressIosPicker = (field: any) => {
			let options: string[] = [];

			if (availableGenders === null) {
					return;
			}


			for (const gender of availableGenders) {
					options.push(gender.name);
			}
			options.push(t('general.ios_picker.cancel'))

			const cancelButtonIndex = options.indexOf(t('general.ios_picker.cancel'));

			showActionSheetWithOptions({
					options: options,
					cancelButtonIndex: cancelButtonIndex,
					title: t('general.ios_picker.choose_an_option')
			}, (selectedIndex) => {
					// @ts-ignore
					const label = options[selectedIndex];

					if (label === t('general.ios_picker.cancel')) {
							return;
					}

					let gender = availableGenders.filter(value => value.name === label);
					if (availableGenders === null) {
							return;
					}
					if (gender === null) {
							return;
					}

					field.onChange(gender[0].id);
			});

	}

	const getGenderLabel = (genderId: number) => {
			const option = availableGenders.filter(value => value.id === genderId);

			if (option[0] === undefined) {
					return '';
			}

			return option[0]?.name ?? ''
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
                            {t('general.birth_date')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="date_birthday"
                            rules={{
                                required: t('general.birth_date_required'),
                                validate: (value) => {
                                const date = new Date(value)
                                if (isNaN(date.getTime())) {
                                    return t('general.birth_date_invalid');
                                } else if (date.getTime() > Date.now()) {
                                    return t('general.birth_date_not_in_future');
                                } else if (date.getTime() < new Date('1900-01-01').getTime()) {
                                    return t('general.birth_date_max_age');
                                } else if (date.getTime() > new Date().setFullYear(new Date().getFullYear() - 18)) {
                                    return t('general.birth_date_min_age');
                                }
                                return true;
                                }
                            }}
                            render={({field}) => (
                                <DatePicker
                                    onDateChange={field.onChange}
                                    pressableClass="border-gray_strong border-[1px]"
                                    color={Colors.secondary}
                                    textColor="secondary"
                                    initialDate={field.value}
                                    height={60}
                                    textBoldness="semiBold"
                                    disabled={loading}
                                />
                            )}
                        />
                        {errors.date_birthday && errors.date_birthday.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.date_birthday.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                                {t('auth.sign_up.personal_information.gender')}
                        </CustomText>

                        <Controller
                            control={control}
                            name="gender_id"
                            rules={{
                                required: t('auth.sign_up.personal_information.gender_required'),
                                validate: value => value !== 0 || t('auth.sign_up.personal_information.gender_required')
                            }}
                            render={({field}) => (
                                <View
                                    className="relative mt-2 border-[1px] border-gray_strong focus:border-support_primary rounded-lg flex justify-center">
                                    {
                                        Platform.OS === 'android' ? (
                                                <Picker
                                                    selectedValue={field.value}
                                                    onValueChange={(value) => field.onChange(value)}
                                                    style={{
                                                            width: "96%",
                                                            margin: "auto",
                                                            height: 60,
                                                            color: Colors.secondary,
                                                    }}
                                                    placeholder={t('auth.sign_up.personal_information.gender_placeholder')}
                                                    dropdownIconColor={Colors.secondary}
                                                >
                                                        <Picker.Item
                                                            label={t('auth.sign_up.personal_information.gender_placeholder')}
                                                            value={null}
                                                            color={Colors.gray_medium}
                                                        />
                                                        {
                                                            availableGenders.map((gender: { id: number, name: string }) => {
                                                                return (
                                                                    <Picker.Item
                                                                        key={`gender-${gender.id}`}
                                                                        label={gender.name}
                                                                        value={gender.id}
                                                                        color={Colors.primary}
                                                                    />
                                                                )
                                                            })
                                                        }
                                                </Picker>
                                        ) : (
                                            <View>
                                                <TouchOpacity
                                                    className={`
                                                        rounded-lg py-3 px-5 h-14
                                                    `}
                                                    onPress={() => handlePressIosPicker(field)}
                                                >
                                                    <CustomText
                                                        className="mt-1 text-white"
                                                        color="support_secondary"
                                                    >
                                                        {getGenderLabel(field.value)}
                                                    </CustomText>
                                                </TouchOpacity>
                                            </View>
                                        )
                                    }
                                </View>
                            )}
                        />
                        {errors.gender_id && errors.gender_id.message && (
                            <CustomText
                                size="small"
                                color="error"
                                classes="mt-1"
                            >
                                {errors.gender_id.message as string}
                            </CustomText>
                        )}
                    </View>

                    <View>
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.nif')}
                        </CustomText>
                        <Controller
                            control={control}
                            name="nif"
                            rules={{
                                required: t('general.nif_required'),
                                pattern: { value: /^[0-9]{9}$/, message: t('general.nif_invalid') },
                                minLength: { value: 9, message: t('general.nif_min_length') },
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

