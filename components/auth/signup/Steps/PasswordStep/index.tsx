import CheckMark from '@/assets/icons/check-mark'
import XIcon from '@/assets/icons/x'
import { CustomText } from '@/components/CustomText'
import CustomTextInput from '@/components/CustomTextInput'
import DatePicker from '@/components/DatePicker'
import { ThemedText } from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import { Feather, FontAwesome6 } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { Control, Controller, FieldErrors, FieldValues, set } from 'react-hook-form'
import { Pressable, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { ScrollView } from 'react-native'
import { commonPasswords, offensiveUsernames } from '@/utils'
import { useTranslation } from "react-i18next"

const PasswordStep = ({
  control,
  errors
}: {
  control: any,
  errors: FieldErrors<FieldValues>,
}) => {
  const { t } = useTranslation();
  const wrongPassword = {
    MINIMUM: t('general.password_min_length'),
    UPPERCASE: t('general.password_uppercase'),
    LOWERCASE: t('general.password_lowercase'),
    NUMBER: t('general.password_number'),
    SPECIAL_CHAR: t('general.password_special_character'),
    COMMON: t('general.password_common'),
    MATCH: t('general.password_match'),
  }
  const [passwordErrors, setPasswordErrors] = useState({
    MINIMUM: true,
    UPPERCASE: true,
    LOWERCASE: true,
    NUMBER: true,
    SPECIAL_CHAR: true,
    COMMON: true,
    MATCH: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = () => {
    const password = control._formValues.password;
    const password_confirmation = control._formValues.password_confirmation;
    const errors = {
      MINIMUM: password.length < 8,
      UPPERCASE: !/[A-Z]/.test(password),
      LOWERCASE: !/[a-z]/.test(password),
      NUMBER: !/[0-9]/.test(password),
      SPECIAL_CHAR: !/[!@?#$%^&*_/-]/.test(password),
      COMMON: commonPasswords.includes(password),
      MATCH: password !== password_confirmation,
    };

    setPasswordErrors(errors);

    // NOTA: tem de devolver a mensagem em texto (não `false`), senão o
    // react-hook-form marca o campo como inválido mas errors.password.message
    // fica undefined -- a única pista visual passa a ser a checklist acima,
    // sem nenhum texto de erro junto ao próprio campo.
    const firstFailedKey = (Object.keys(errors) as (keyof typeof errors)[]).find((key) => errors[key]);
    if (firstFailedKey) {
      return wrongPassword[firstFailedKey];
    }

    return true;
  };

  useEffect(() => {
    validatePassword();
  }, []);

  return (
    <View className="flex-1">
      <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
        {t('auth.sign_up.password_information.title')}
      </CustomText>
      <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
        {t('auth.sign_up.password_information.subtitle')}
      </CustomText>

      <View className="mt-8">
        <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
          {t('general.username')}
        </CustomText>

        <Controller
            control={control}
            name="username"
            rules={{
              required: t('general.username_required'),
              minLength: { value: 2, message: t('general.username_min_length') },
              validate: (value) => {
                  if (value.length > 30) {
                    return t('general.username_max_length')
                  } else if (/[^a-zA-Z0-9_]/.test(value)) {
                    return t('general.username_invalid_characters')
                  } else if (value.trim().length === 0) {
                    return t('general.username_cannot_be_empty_or_only_spaces')
                  } else if (/^\d+$/.test(value)) {
                    return t('general.username_cannot_be_only_numbers')
                  } else if (/\s/.test(value)) {
                    return t('general.username_cannot_contain_spaces')
                  } else if (offensiveUsernames.includes(value.toLowerCase())) {
                    return t('general.username_not_allowed')
                  }
                  return true;
              }

            }}
            render={({ field }) => (
                <View className="mt-2">
                  <CustomTextInput
                    {...field}
                    size="large"
                    onChangeText={(value: string) => {
                      const filteredValue = value.replace(/\s/g, '');
                      field.onChange(filteredValue);
                    }}
                    placeholder={t('general.username_placeholder')}
                    error={errors.username && errors.username.message}
                    displayErrorIcon={true}
                    success={!errors.username && field.value}
                    displaySuccessIcon={true}
                  />
                </View>
            )}
        />
        {errors.username && errors.username.message && (
            <CustomText
              size="small"
              color="error"
              classes="mt-1"
            >
              {errors.username.message as string}
            </CustomText>
        )}
      </View>

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
            validate: () => validatePassword()
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
                      >
                        <View className="w-full h-full items-center justify-center">
                          <Feather name={showPassword ? 'eye' : 'eye-off'} size={24} color={Colors.secondary} />
                        </View>
                      </TouchableWithoutFeedback>
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
          )}
        />
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
            validate: () => validatePassword()
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
              {errors.password_confirmation && errors.password_confirmation.message && (
                <CustomText
                  size="small"
                  color="error"
                  classes="mt-1"
                >
                  {errors.password_confirmation.message as string}
                </CustomText>
              )}
            </View>
          )}
        />
      </View>

      <View className="mt-4">
        {
          Object.keys(passwordErrors).map((key) => (
            <View key={key} className="flex flex-row gap-2 items-center">
              {
                passwordErrors[key as keyof typeof passwordErrors] ? (
                  <View className="w-3 h-3">
                    <XIcon color={Colors.error} />
                  </View>
                ) : (
                  <View className="w-4 h-4">
                    <CheckMark color={Colors.success} />
                  </View>
                )
              }
              <CustomText color="gray_medium" size="small" numberOfLines={2}>
                {wrongPassword[key as keyof typeof wrongPassword]}
              </CustomText>
            </View>
          ))
        }
      </View>
    </View>
  )
}

export default PasswordStep;