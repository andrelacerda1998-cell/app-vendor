import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { View, TouchableWithoutFeedback, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useApi } from "@/contexts/ApiContext";
import { useSession } from "@/contexts/SessionContext";
import axios from "axios";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { Controller, useForm } from "react-hook-form";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { CustomText } from "@/components/CustomText";
import { useTranslation } from "react-i18next";

const SignIn = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { setSession } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { control, handleSubmit, formState: { errors, isValid }, setError } = useForm({
    mode: 'onChange',
    defaultValues: {
        email: '',
        password: '',
    }
  });

  async function signIn(data: { email: string, password: string }) {
    setIsLoggingIn(true);
    try {
      const response = await api.post(API_ROUTES.AUTH_LOGIN, {
        email: data.email,
	      password: data.password,
        type: 'vendor'
      });
      const { access_token } = response?.data.data;

      if (access_token) {
          setSession(access_token);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (
          error.response?.status === 400 ||
          error.response?.status === 422
        ) {
          setError('email', {
            type: 'manual',
            message: t('errors.invalid_email_or_password')
          });
          setError('password', {
            type: 'manual',
            message: ''
          })
        } else if (
          error.response?.status === 500 ||
          error.response?.status === 503
        ) {
          setError('email', {
            type: 'manual',
            message: t('errors.server_error')
          });
          setError('password', {
            type: 'manual',
            message: ''
          })
        }
      }
    }
    setIsLoggingIn(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg px-6">
      {/* Back button (top-left) */}
      <View className="pt-2">
        <TouchableWithoutFeedback onPress={() => router.push('/(auth)')}>
          <View className="w-10 h-10 items-center justify-center rounded-full bg-card">
            <Feather name="chevron-left" size={24} color={Colors.secondary} />
          </View>
        </TouchableWithoutFeedback>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand tile */}
        <View className="items-center">
          <View className="w-[68px] h-[68px] rounded-[18px] bg-support_primary items-center justify-center">
            <MaterialCommunityIcons name="hammer-wrench" size={34} color={Colors.on_brand} />
          </View>
          <CustomText size="subtitle" color="secondary" boldness="bolder" classes="mt-5 text-center">
            {t('auth.sign_in.title')}
          </CustomText>
          <CustomText size="medium" color="muted" boldness="regular" classes="mt-1.5 text-center" numberOfLines={2}>
            {t('auth.sign_in.subtitle')}
          </CustomText>
        </View>

        {/* Email */}
        <View className="mt-8">
          <Controller
            control={control}
            name="email"
            defaultValue=""
            rules={{
              required: `${t('general.email_required')}`,
              pattern: { value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, message: `${t('general.email_invalid')}` }
            }}
            render={({ field }) => (
              <View
                className="flex-row items-center rounded-2xl bg-card border px-4"
                style={{ borderColor: errors.email ? Colors.danger : Colors.line, height: 56 }}
              >
                <Feather name="mail" size={20} color={Colors.muted} />
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder={t('general.email_placeholder')}
                  placeholderTextColor={Colors.muted}
                  className="flex-1 ml-3"
                  style={{ color: Colors.secondary, fontFamily: 'Poppins_500Medium', fontSize: 16 }}
                />
              </View>
            )}
          />
          {errors.email && errors.email.message ? (
            <CustomText size="small" color="danger" boldness="regular" classes="mt-1.5" numberOfLines={5}>
              {errors.email.message}
            </CustomText>
          ) : null}
        </View>

        {/* Password */}
        <View className="mt-4">
          <Controller
            control={control}
            name="password"
            defaultValue=""
            rules={{
              required: `${t('general.password_required')}`,
              minLength: { value: 8, message: t('general.password_min_length') }
            }}
            render={({ field }) => (
              <View
                className="flex-row items-center rounded-2xl bg-card border px-4"
                style={{ borderColor: errors.password ? Colors.danger : Colors.line, height: 56 }}
              >
                <Feather name="lock" size={20} color={Colors.muted} />
                <TextInput
                  value={field.value}
                  onChangeText={(value: string) => field.onChange(value.replace(/\s/g, ''))}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  textContentType="password"
                  secureTextEntry={!showPassword}
                  placeholder={t('general.password_placeholder')}
                  placeholderTextColor={Colors.muted}
                  className="flex-1 ml-3"
                  style={{ color: Colors.secondary, fontFamily: 'Poppins_500Medium', fontSize: 16 }}
                />
                <TouchableWithoutFeedback
                  onPress={() => setShowPassword(prev => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={t('general.toggle_password_visibility')}
                  accessibilityState={{ expanded: showPassword }}
                >
                  <View className="w-8 h-full items-center justify-center">
                    <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={Colors.muted} />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            )}
          />
          {errors.password && errors.password.message ? (
            <CustomText size="small" color="danger" boldness="regular" classes="mt-1.5" numberOfLines={5}>
              {errors.password.message}
            </CustomText>
          ) : null}
        </View>

        {/* Forgot password */}
        <TouchableWithoutFeedback
          onPress={() => router.push('/(auth)/forgot-password')}
          disabled={isLoggingIn}
        >
          <CustomText size="medium" color="muted" boldness="medium" numberOfLines={1} classes="mt-4 self-end">
            {t('auth.sign_in.forgot_password')}
          </CustomText>
        </TouchableWithoutFeedback>

        {/* Submit */}
        <View className="mt-7">
          <CustomTouchableOpacity
            type="support_primary"
            size="large"
            text={isLoggingIn ? t('auth.sign_in.signing_in') : t('auth.sign_in.sign_in')}
            textSize="medium"
            textColor="on_brand"
            textBoldness="bold"
            onPress={handleSubmit((data) => signIn(data))}
            disabled={isLoggingIn || !isValid}
          />
        </View>

        {/* Create account */}
        <View className="flex-row items-center justify-center mt-6">
          <CustomText size="medium" color="muted" boldness="regular">
            {t('auth.sign_in.no_account')}
          </CustomText>
          <TouchableWithoutFeedback onPress={() => router.push('/(auth)/signup')} disabled={isLoggingIn}>
            <CustomText size="medium" color="support_primary" boldness="bold" classes="ml-1.5">
              {t('auth.home.create_account')}
            </CustomText>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
