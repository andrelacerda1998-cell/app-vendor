import CheckMark from '@/assets/icons/check-mark'
import XIcon from '@/assets/icons/x'
import BackHeader from "@/components/app/BackHeader"
import { CustomText } from '@/components/CustomText'
import CustomTextInput from '@/components/CustomTextInput'
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { API_ROUTES } from "@/constants/ApiRoutes"
import { Colors } from '@/constants/Colors'
import { useApi } from "@/contexts/ApiContext"
import { useDialog } from "@/contexts/DialogContext"
import { useSession } from "@/contexts/SessionContext"
import { Feather } from '@expo/vector-icons';
import axios from "axios"
import { router, useLocalSearchParams } from "expo-router"
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from "react-i18next"
import { TouchableWithoutFeedback, View } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { SafeAreaView } from "react-native-safe-area-context"

/**
 * Mesmo mínimo do registo e do backend (`Password::min(8)->uncompromised()`
 * no ResetPasswordRequest): só comprimento, sem regras de composição.
 */
const PASSWORD_MIN_LENGTH = 8;

/**
 * A regra `uncompromised` só é verificável no servidor — a app não a consegue
 * antecipar. Quando o 422 vem por esse motivo, mostramos a nossa mensagem.
 */
const isBreachedPasswordMessage = (message: string) =>
  /fuga|comprometid|violaç|breach|compromis/i.test(message ?? '');

const ResetPassword = () => {
  const { t } = useTranslation();
  const { email, token } = useLocalSearchParams();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  // Espelho local do que está escrito, só para o feedback ao vivo do comprimento.
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isLongEnough = password.length >= PASSWORD_MIN_LENGTH;

  const { control, handleSubmit, setValue, formState: { errors, isValid }, setError } = useForm({
    mode: 'onChange',
    defaultValues: {
      password: '',
      password_confirmation: '',
    }
  });

  const validateLength = () => {
    if (setResetPasswordError) setResetPasswordError(null);
    return (control._formValues.password ?? '').length >= PASSWORD_MIN_LENGTH
      ? true
      : t('general.password_length_requirement');
  };

  const validateMatch = () => {
    if (setResetPasswordError) setResetPasswordError(null);
    return control._formValues.password === control._formValues.password_confirmation
      ? true
      : t('general.password_match');
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      if (session) {
        router.push('/(app)/(tabs)/home');
      } else {
        router.push('/(auth)');
      }
    }
  }

  const resetPassword = async (data: any) => {
    if (setResetPasswordError) setResetPasswordError(null);
    setIsLoading(true);
    try {
      await api.post(API_ROUTES.AUTH_RESET_PASSWORD, {
        ...data,
        email,
        token
      });

      openDialog({
        icon: <CheckMark color={Colors.primary} />,
        title: t('auth.reset_password.success.title'),
        subtitle: t('auth.reset_password.success.subtitle'),
        closeAfterMSeconds: 3000,
        closeOnClickOutside: true,
        onClose: () => {
          goBack();
        }
      });
    } catch(error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          // O 422 pode agora vir também da regra `uncompromised` — distinguimos
          // pela mensagem do servidor para não culpar o técnico do motivo errado.
          const serverMessage: string = error.response?.data?.errors?.password?.[0] ?? '';
          setResetPasswordError(
            isBreachedPasswordMessage(serverMessage)
              ? t('general.password_uncompromised')
              : t('auth.reset_password.errors.password_used_before')
          );
        } else if (error.response?.status === 404) {
          setResetPasswordError(t('auth.reset_password.errors.token_invalid'));
        } else if (error.response?.status === 500) {
          setResetPasswordError(t('errors.server_error'));
        } else {
          setResetPasswordError(t('errors.occurred_an_error'));
        }
      }
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 p-5 bg-primary">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('auth.reset_password.title')}
          </CustomText>
        )}
        otherClasses="pb-5"
        onBack={goBack}
      />
      <KeyboardAwareScrollView bottomOffset={20}>
        <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
          {t('auth.reset_password.title')}
        </CustomText>
        <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
          {t('auth.reset_password.subtitle')}
        </CustomText>

        <View className="mt-8">
          <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
            {t('general.password')}
          </CustomText>

          <Controller
            control={control}
            name="password"
            defaultValue=""
            rules={{
              required: t('general.password_required'),
              validate: validateLength
            }}
            render={({ field }) => (
              <View className="mt-2 justify-center" removeClippedSubviews={true}>
                <CustomTextInput
                  {...field}
                  size="large"
                  onChangeText={(value: string) => {
                    const filteredValue = value.replace(/\s/g, '');
                    setPassword(filteredValue);
                    field.onChange(filteredValue);
                  }}
                  textContentType="password"
                  placeholder={t('general.password_placeholder')}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  contextMenuHidden={true}
                  pointerEvents="box-only"
                  error={errors.password && errors.password.message}
                  success={!errors.password && field.value}
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
              </View>
            )}
          />
          {errors.password && errors.password.message && (
            <CustomText
              size="small"
              color="error"
              classes="mt-1"
            >
              {errors.password.message as string}
            </CustomText>
          )}
        </View>

        <View className="mt-8">
          <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
            {t('general.confirm_password')}
          </CustomText>

          <Controller
            control={control}
            name="password_confirmation"
            defaultValue=""
            rules={{
              required: t('general.confirm_password_required'),
              validate: validateMatch
            }}
            render={({ field }) => (
              <View className="mt-2 justify-center" removeClippedSubviews={true}>
                <CustomTextInput
                    {...field}
                    size="large"
                    onChangeText={(value: string) => {
                      const filteredValue = value.replace(/\s/g, '');
                      field.onChange(filteredValue);
                    }}
                    textContentType="password_confirmation"
                    autoCorrect={false}
                    contextMenuHidden={true}
                    pointerEvents="box-only"
                    placeholder={t('general.confirm_password_placeholder')}
                    secureTextEntry={!showPassword}
                    error={errors.password_confirmation && errors.password_confirmation.message}
                    success={!errors.password_confirmation && field.value}
                />
              </View>
            )}
          />
        </View>

        {/* Uma única linha, com feedback ao vivo. Tudo o resto é validado no servidor. */}
        <View className="mt-6">
          <View className="flex flex-row gap-2 items-center">
            {isLongEnough ? (
              <View className="w-4 h-4">
                <CheckMark color={Colors.success} />
              </View>
            ) : (
              <View className="w-3 h-3">
                <XIcon color={Colors.error} />
              </View>
            )}
            <CustomText color={isLongEnough ? 'secondary' : 'gray_medium'} size="small" numberOfLines={2}>
              {t('general.password_length_requirement')}
            </CustomText>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View className="pt-4">
        {resetPasswordError && (
            <CustomText
                size="small"
                color="error"
                boldness="medium"
                className="text-center mb-2"
            >
                {resetPasswordError}
            </CustomText>
        )}
        <CustomTouchableOpacity
            type="secondary"
            size="large"
            text={t('auth.reset_password.button')}
            textColor="primary"
            textBoldness="semiBold"
            disabled={isLoading}
            onPress={handleSubmit((data) => resetPassword(data))}
        />
      </View>

    </SafeAreaView>
  )
}

export default ResetPassword;
