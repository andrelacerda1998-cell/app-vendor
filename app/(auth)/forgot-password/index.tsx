import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { Controller, useForm } from "react-hook-form";
import BackHeader from "@/components/app/BackHeader";
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import CustomTextInput from "@/components/CustomTextInput";
import EmailIcon from "@/assets/icons/email";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors, isLoading, isValid }, setError } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
    }
  });

  const sendResetEmail = ({ email }: { email: string }) => {
    setSendingEmail(true);
    api.post(API_ROUTES.AUTH_LOGIN_FORGOT_PASSWORD, {
      email,
      type: 'vendor',
    })
    .then(() => {
      setEmailSent(true);
    })
    .catch(error => {
      if (error.response?.status === 422) {
        setError('email', {
          type: 'manual',
          message: t('errors.user_not_found')
        });
      } else if (error.response?.status === 500) {
        setError('email', {
          type: 'manual',
          message: t('errors.server_error')
        });
      } else if (error.response?.status === 400) {
        setError('email', {
          type: 'manual',
          message: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.wait_before_trying_again')
        });
      } else {
        setError('email', {
          type: 'manual',
          message: t('errors.reset_password_email.subtitle')
        });
      }
    })
    .finally(() => {
      setSendingEmail(false);
    });
  };

  return (
    <SafeAreaView className="flex-1 p-6" style={{ backgroundColor: Colors.primary }}>
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText
            color="secondary"
          >
            {t('auth.forgot_password.header')}
          </CustomText>
        )}
      />
      {emailSent ? (
        <KeyboardAwareScrollView contentContainerStyle={{
          flexGrow: 1,
          width: "100%",
          justifyContent: "space-between",
          borderTopStartRadius: 30,
          borderTopEndRadius: 30,
        }}>
          <View className="flex-1 justify-between mt-8">
            <View className="flex-1 justify-center">
              <View className="h-20 w-20 flex items-center justify-center rounded-full self-center mb-4" style={{ backgroundColor: Colors.support_primary }}>
                <View className="h-8 w-8">
                  <EmailIcon color={Colors.primary} />
                </View>
              </View>
              <View>
                <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3} classes="text-center">
                  {t('auth.forgot_password.email_sent.title')}
                </CustomText>
                <CustomText color="gray_medium" numberOfLines={3} classes="mt-2 text-center">
                  {t('auth.forgot_password.email_sent.subtitle')}
                </CustomText>
              </View>
            </View>
            <View>
              <CustomText color="gray_medium" numberOfLines={5} classes="mt-2 text-center">
                {t('auth.forgot_password.email_sent.check_spam')}
              </CustomText>
              <View className="mt-4">
                <CustomTouchableOpacity
                  type="support_primary"
                  size="large"
                  text={t('auth.forgot_password.email_sent.resend_email')}
                  textSize="medium"
                  textColor="primary"
                  textBoldness="bold"
                  onPress={() => {
                    setEmailSent(false);
                    sendResetEmail({ email: control._formValues.email });
                  }}
                />
              </View>
              <View className="mt-4">
                <CustomTouchableOpacity
                  type="support_primary"
                  size="large"
                  text={t('auth.forgot_password.email_sent.already_reset_password')}
                  textSize="medium"
                  textColor="primary"
                  textBoldness="bold"
                  onPress={() => router.push('/(auth)')}
                />
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView contentContainerStyle={{
          flexGrow: 1,
          width: "100%",
          justifyContent: "space-between",
          borderTopStartRadius: 30,
          borderTopEndRadius: 30,
        }}>
          <View className="mt-8">
            <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
              {t('auth.forgot_password.email_not_sent.title')}
            </CustomText>
            <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
              {t('auth.forgot_password.email_not_sent.subtitle')}
            </CustomText>

            <View className="mt-8">
              <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                {t('general.email')}
              </CustomText>

              <Controller
                  control={control}
                  name="email"
                  defaultValue=""
                  rules={{
                    required: t('general.email_required'),
                    pattern: { value: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i, message: t('general.email_invalid') }
                  }}
                  render={({ field }) => (
                      <View className="mt-2">
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
                  classes="mt-1"
                  numberOfLines={6}
                >
                  {errors.email.message as string}
                </CustomText>
              )}
            </View>
          </View>
          <View className="mt-6">
            <CustomTouchableOpacity
              type="support_primary"
              size="large"
              text={sendingEmail ? t('auth.forgot_password.email_not_sent.sending_email') : t('auth.forgot_password.email_not_sent.send_email')}
              textSize="medium"
              textColor="primary"
              textBoldness="bold"
              onPress={handleSubmit((data) => sendResetEmail(data))}
              disabled={sendingEmail}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ForgotPassword;
