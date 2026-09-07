import {CustomText} from '@/components/CustomText'
import CustomTextInput from '@/components/CustomTextInput'
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import DatePicker from '@/components/DatePicker'
import TouchOpacity from "@/components/TouchOpacity"
import {API_ROUTES} from "@/constants/ApiRoutes"
import {Colors} from '@/constants/Colors'
import {useApi} from "@/contexts/ApiContext"
import {useDialog} from "@/contexts/DialogContext"
import {useSession} from "@/contexts/SessionContext"
import {VendorDataInterface} from "@/types/session"
import {validateNIF} from "@/utils"
import {useActionSheet} from "@expo/react-native-action-sheet"
import {Picker} from "@react-native-picker/picker"
import React, {useEffect, useState} from 'react'
import { Controller, useForm } from 'react-hook-form';
import {useTranslation} from "react-i18next"
import { Platform, View } from 'react-native';
import {KeyboardAwareScrollView} from "react-native-keyboard-controller"

const PersonalInformationStep = ({
    onNext
}: {
    onNext: (data: VendorDataInterface) => void;
}) => {
    const {api} = useApi();
    const {vendorData, setVendorData, getAvailableGenders, availableGenders} = useSession();
    const {t} = useTranslation();
    const {showActionSheetWithOptions} = useActionSheet();
    const {openDialog} = useDialog();
    const [updating, setUpdating] = useState<boolean>(false);

    const {
        control,
        handleSubmit,
        setValue,
        formState: {errors, isLoading, isValid},
        getValues,
        setError
    } = useForm<any>({
        mode: 'onChange',
        defaultValues: {
            nif: vendorData?.user.nif || "",
            date_birthday: vendorData?.user.date_birthday
                ? new Date(vendorData.user.date_birthday)
                : new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
            gender_id: Number(vendorData?.user?.gender_id) || 0,
        }
    });

    useEffect(() => {
        if (availableGenders === null || availableGenders.length === 0) {
            getAvailableGenders();
        }
    }, []);

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

    const handleUpdate = async () => {
        // 'name' => 'required|string|max:50',
        //         // 'first_name' => 'required|string|max:255',
        //         // 'last_name' => 'required|string|max:255',
        //         'date_birthday' => 'date|before_or_equal:today',
        //         'nif' => ['string', new NifRule],
        //         // 'email' => 'required|email|unique:users,email',
        //         'phone_number' => 'string|nullable',
        //         // 'language' => 'string',
        //         'gender_id' => 'nullable|integer|exists:genders,id',

        setUpdating(true);

        const formData = new FormData();
        formData.append('name', vendorData?.user.name || '');
        formData.append('date_birthday', new Date(getValues('date_birthday') as Date).toISOString().split('T')[0]);
        formData.append('nif', getValues('nif'));
        formData.append('phone_number', vendorData?.user.phone_number || '');
        formData.append('gender_id', String(getValues('gender_id') || '1'));

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
                        // name: getValues('name'),
                    },
                });

                // handleGoBack();

                // openDialog({
                // 		icon: <CheckMark color={Colors.primary}/>,
                // 		title: t('profile.edit.success.title'),
                // 		subtitle: t('profile.edit.success.subtitle'),
                // 		closeAfterMSeconds: 2000,
                // 		closeOnClickOutside: true,
                // 		onClose: () => {
                // 		}
                // 	})
                onNext({
                    ...vendorData,
                    user: {
                        ...newUserData,
                    },
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
                setUpdating(false);
            })
    }

    // const openSaveDialog = () => {
    // 		openDialog({
    // 				title: t('profile.edit.save.title'),
    // 				subtitle: t('profile.edit.save.subtitle'),
    // 				successButtonText: t('profile.edit.save.confirm'),
    // 				cancelButtonText: t('profile.edit.save.cancel'),
    // 				onSuccess: () => {
    // 						handleUpdate();
    // 				},
    // 		})
    // }

    return (
        <View className="flex-1 p-5">
            <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
                {t('auth.sign_up.personal_information.title')}
            </CustomText>
            <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
                {t('auth.sign_up.personal_information.subtitle')}
            </CustomText>


            <KeyboardAwareScrollView bottomOffset={20}>
                <View className="flex-1">
                    <View className="mt-4">
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
                                    className="relative mt-2 border-[1px] rounded-lg flex justify-center"
                                    style={{ borderColor: Colors.gray_strong }}>
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

                    <View className="mt-8">
                        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                            {t('general.birth_date')}
                        </CustomText>


                        <Controller
                            control={control}
                            name="date_birthday"
                            defaultValue=""
                            rules={{
                                required: t('general.birth_date_required'), validate: (value) => {
                                    const date = new Date(value)
                                    if (isNaN(date.getTime())) {
                                        return t('general.birth_date_invalid')
                                    } else if (date.getTime() > Date.now()) {
                                        return t('general.birth_date_not_in_future')
                                    } else if (date.getTime() < new Date('1900-01-01').getTime()) {
                                        return t('general.birth_date_max_age')
                                    } else if (date.getTime() > new Date().setFullYear(new Date().getFullYear() - 18)) {
                                        return t('general.birth_date_min_age')
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
                                    height={62}
                                    fontSize="medium"
                                    textBoldness="regular"
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

                    <View className="mt-8">
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
                </View>
            </KeyboardAwareScrollView>

            <View className="pt-5">
                {/* {signUpError && (
                <CustomText
                    size="small"
                    color="error"
                    boldness="medium"
                    className="text-center mb-2"
                >
                    {signUpError}
                </CustomText>
            )} */}

                <CustomTouchableOpacity
                    type="support_primary"
                    size="large"
                    text={t('auth.sign_up.continue_sign_up')}
                    textColor="primary"
                    textBoldness="semiBold"
                    disabled={isLoading || updating}
                    onPress={handleSubmit(handleUpdate)}
                />
            </View>

        </View>
    )
}

export default PersonalInformationStep;
