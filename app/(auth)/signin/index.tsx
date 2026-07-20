import { View, TouchableWithoutFeedback, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useApi } from "@/contexts/ApiContext";
import { useSession } from "@/contexts/SessionContext";
import axios from "axios";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { Controller, useForm } from "react-hook-form";
import BackHeader from "@/components/app/BackHeader";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { CustomText } from "@/components/CustomText";
import CustomTextInput from "@/components/CustomTextInput";
import FacebookIcon from "@/assets/icons/facebook";
import GoogleIcon from "@/assets/icons/google";
import AppleIcon from "@/assets/icons/apple";
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
    <SafeAreaView className="flex-1 bg-primary p-6">
      <BackHeader
        backButtonColor="secondary"
        onBack={() => router.push('/(auth)')}
      />
      <ScrollView contentContainerStyle={{
        flexGrow: 1,
        width: "100%",
        justifyContent: "space-between",
        borderTopStartRadius: 30,
        borderTopEndRadius: 30,
      }}>
          <View className="flex-1">
          <View className="mt-8">
            <CustomText
              size="title"
              color="secondary"
              boldness="bold"
            >
              {t('auth.sign_in.title')}
            </CustomText>
            <CustomText
              size="medium"
              color="gray_medium"
              boldness="regular"
              numberOfLines={2}
              classes="mt-2"
            >
              {t('auth.sign_in.subtitle')}
            </CustomText>
          </View>

          <View className="flex-1 mt-8">
            <View className="mt-4">
              <CustomText
                size="medium"
                color="secondary"
                boldness="bold"
              >
                {t('general.email')}
              </CustomText>

              <Controller
                control={control}
                name="email"
                defaultValue=""
                rules={{
                  required: `${t('general.email_required')}`,
                  pattern: { value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, message: `${t('general.email_invalid')}` }
                }}
                render={({ field }) => (
                  <View className="relative mt-2">
                    <CustomTextInput
                      {...field}
                      size="large"
                      onChangeText={field.onChange}
                      autoCapitalize="none"
                      placeholder={t('general.email_placeholder')}
                      textContentType="emailAddress"
                      error={errors.email && errors.email.message}
                      displayErrorIcon={true}
                      success={!errors.email && field.value}
                      displaySuccessIcon={true}
                    />
                  </View>
                )}
              />
              {errors.email && errors.email.message && (
                <CustomText
                  size="small"
                  color="error"
                  boldness="regular"
                  classes="mt-1"
                  numberOfLines={5}
                >
                  {errors.email.message}
                </CustomText>
              )}
            </View>

            <View className="mt-6">
              <CustomText
                size="medium"
                color="secondary"
                boldness="bold"
              >
                {t('general.password')}
              </CustomText>

              <Controller
                control={control}
                name="password"
                defaultValue=""
                rules={{
                  required: `${t('general.password_required')}`,
                  minLength: { value: 8, message: t('general.password_min_length') }
                }}
                render={({ field }) => (
                  <View className="relative mt-2">
                    <CustomTextInput
                      {...field}
                      onChangeText={(value: string) => {
                        const filteredValue = value.replace(/\s/g, '');
                        field.onChange(filteredValue);
                      }}
                      textContentType="password"
                      placeholder={t('general.password_placeholder')}
                      autoCapitalize="none"
                      secureTextEntry={!showPassword}
                      size="large"
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
                  </View>
                )}
              />
              {errors.password && errors.password.message && (
                <CustomText
                  size="small"
                  color="error"
                  boldness="regular"
                  classes="mt-1"
                  numberOfLines={5}
                >
                  {errors.password.message}
                </CustomText>
              )}
            </View>
            <TouchableWithoutFeedback
              onPress={() => {
                router.push('/(auth)/forgot-password');
              }}
              disabled={isLoggingIn}
            >
              <CustomText
                size="medium"
                color={isLoggingIn ? "gray_light" : "secondary"}
                boldness="bold"
                numberOfLines={1}
                classes="mt-4 self-end"
              >
                {t('auth.sign_in.forgot_password')}
              </CustomText>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </ScrollView>
      <View className="mt-6">
        <CustomTouchableOpacity
          type="support_primary"
          size="large"
          text={isLoggingIn ? t('auth.sign_in.signing_in') : t('auth.sign_in.sign_in')}
          textSize="medium"
          textColor="primary"
          textBoldness="bold"
          onPress={handleSubmit((data) => signIn(data))}
          disabled={isLoggingIn || !isValid}
        />

        {/* <View className="flex-grow-0 flex-row justify-center items-center w-full relative space-x-4 my-6">
          <View className="flex-1 h-[1px] bg-gray_strong rounded-full"></View>
          <CustomText
            size="small"
            color="gray_light"
            boldness="semiBold"
          >
            Or sign in with
          </CustomText>
          <View className="flex-1 h-[1px] bg-gray_strong rounded-full"></View>
        </View>

        <View className="flex-row justify-between">
          <CustomTouchableOpacity
            type="gray_strong_outline"
            size="large"
            classes="w-[30%]"
            disabled={isLoggingIn}
          >
            <FacebookIcon />
          </CustomTouchableOpacity>
          <CustomTouchableOpacity
            type="gray_strong_outline"
            size="large"
            classes="w-[30%]"
            disabled={isLoggingIn}
          >
            <GoogleIcon />
          </CustomTouchableOpacity>
          <CustomTouchableOpacity
            type="gray_strong_outline"
            size="large"
            classes="w-[30%]"
            disabled={isLoggingIn}
          >
            <AppleIcon />
          </CustomTouchableOpacity>
        </View> */}
      </View>
    </SafeAreaView>
  );
};

export default SignIn;
