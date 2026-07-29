import XIcon from "@/assets/icons/x"
import { CustomText } from '@/components/CustomText'
import CustomTextInput from '@/components/CustomTextInput'
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { API_ROUTES } from "@/constants/ApiRoutes"
import { Colors } from '@/constants/Colors'
import { useApi } from "@/contexts/ApiContext"
import { useDialog } from "@/contexts/DialogContext"
import { useSession } from "@/contexts/SessionContext"
import AtSubuserHelp from "@/components/at/AtSubuserHelp"
import { VendorDataInterface } from "@/types/session"
import { validateNIF } from "@/utils"
import { Feather } from "@expo/vector-icons"
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from "react-i18next"
import { TouchableWithoutFeedback, View } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"

const AtUserStep = ({
	onNext,
	onSkip,
}: {
	onNext: (data: VendorDataInterface) => void;
	onSkip: () => void;
}) => {
    const { api } = useApi();
    const { vendorData, setVendorData } = useSession();
    const { openDialog } = useDialog();
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const {control, handleSubmit, formState: {errors, isLoading, isValid}, getValues, setError, reset} = useForm({
        mode: 'onChange',
        defaultValues: {
            at_user: vendorData?.at_user || '',
            at_password: '',
        },
    });
    const [updateError, setUpdateError] = useState(false);

    const updateAtUser = () => {
        setLoading(true);
        api.post(API_ROUTES.POST_AT_USER, {
            at_user: getValues('at_user'),
            at_password: getValues('at_password'),
        })
            .then(() => {
                const newVendorData = {
                    ...vendorData,
                    at_user: getValues('at_user')
                }
                setVendorData(newVendorData);
                // openDialog({
                //     icon: <CheckMark color={Colors.primary}/>,
                //     title: t('profile.edit.at_user.update.title'),
                //     subtitle: t('profile.edit.at_user.update.subtitle'),
                //     closeAfterMSeconds: 2000,
                //     closeOnClickOutside: true,
                //     onClose: () => {
                //     }
                // })
                onNext(newVendorData as VendorDataInterface);
            })
            .catch(err => {
                // Need to handle this error to tell the user what happened
                setUpdateError(err?.data?.data?.message || err?.data?.message || err?.response?.data?.message || err?.message || t('errors.at_user_save.subtitle'));

                openDialog({
                    icon: <XIcon color={Colors.primary}/>,
                    title: t('errors.at_user_save.title'),
                    subtitle: err?.response?.data?.message || t('errors.at_user_save.subtitle'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
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
    //             updateAtUser();
    //         },
    //     })
    // }

  return (
    <View className="flex-1 p-5">
        {/* O rodape (Continuar + "mais tarde") e fixo e fica POR CIMA da lista:
            sem esta folga, o ultimo campo ficava escondido atras dos botoes. */}
        <KeyboardAwareScrollView
            bottomOffset={20}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
        >
            <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
                {t('complete_profile.at_user.title')}
            </CustomText>
            <CustomText color="muted" numberOfLines={5} classes="mt-2 mb-5">
                {t('complete_profile.at_user.subtitle')}
            </CustomText>

            <AtSubuserHelp />

            <View className="space-y-8 flex-1 mt-7">

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
                          accessibilityRole="button"
                          accessibilityLabel={t('general.toggle_password_visibility')}
                          accessibilityState={{ expanded: showPassword }}
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
                </View>
            </View>
        </KeyboardAwareScrollView>
        <View className="pt-5">
            {updateError && (
                <View className="py-2">
                    <CustomText size="small" color="error" boldness="semiBold" numberOfLines={2} className="text-center">
                        {updateError}
                    </CustomText>
                </View>
            )}
            {/* "Guardar alteracoes" nao encaixa num passo de registo: nao ha
                nada anterior para alterar. */}
            <CustomTouchableOpacity
                size="large"
                type="support_primary"
                textColor="primary"
                textBoldness="semiBold"
                text={loading ? t('profile.edit.saving_changes') : t('general.continue')}
                onPress={handleSubmit(updateAtUser)}
                disabled={loading}
            />
            {/* Criar o subutilizador obriga a sair da app e ir ao Portal das
                Financas, muitas vezes no computador. Sem esta saida, o tecnico
                ficava preso aqui e abandonava o registo a meio. O que falta
                continua a aparecer no aviso da Home. */}
            <CustomTouchableOpacity
                size="large"
                type="transparent"
                textColor="muted"
                textSize="medium"
                textBoldness="regular"
                text={t('complete_profile.at_user.later')}
                onPress={onSkip}
                disabled={loading}
                classes="self-center mt-1"
            />
        </View>
    </View>
  )
}

export default AtUserStep;
