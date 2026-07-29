import CheckMark from '@/assets/icons/check-mark'
import { CustomText } from '@/components/CustomText'
import CustomTextInput from '@/components/CustomTextInput'
import { Colors } from '@/constants/Colors'
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react'
import { Controller, FieldErrors, FieldValues } from 'react-hook-form';
import { TouchableWithoutFeedback, View } from 'react-native';
import { useTranslation } from "react-i18next"

/**
 * Comprimento mínimo da palavra-passe. Alinhado com o backend
 * (`Password::min(8)->uncompromised()` no CreateVendorRequest).
 *
 * Não há regras de composição (maiúsculas/números/símbolos): só comprimento. A
 * defesa que resta é o `uncompromised()` do servidor, que rejeita palavras-passe
 * já vistas em fugas de dados — e essa a app não consegue verificar localmente.
 */
const PASSWORD_MIN_LENGTH = 8;

const PasswordStep = ({
  control,
  errors
}: {
  control: any,
  errors: FieldErrors<FieldValues>,
}) => {
  const { t } = useTranslation();
  // Espelho local do que está escrito, só para o feedback ao vivo do comprimento.
  const [password, setPassword] = useState<string>(control._formValues.password ?? '');
  const [showPassword, setShowPassword] = useState(false);

  const isLongEnough = password.length >= PASSWORD_MIN_LENGTH;
  const lengthHint = t('general.password_length_requirement');

  const validateLength = () =>
    (control._formValues.password ?? '').length >= PASSWORD_MIN_LENGTH
      ? true
      : lengthHint;

  const validateMatch = () =>
    control._formValues.password === control._formValues.password_confirmation
      ? true
      : t('general.password_match');

  return (
    <View className="flex-1">
      <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
        {t('auth.sign_up.password_information.title')}
      </CustomText>
      <CustomText color="muted" numberOfLines={3} classes="mt-2">
        {t('auth.sign_up.password_information.subtitle')}
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
              {/* Uma só linha para a regra do comprimento, colada ao campo.
                  Fica neutra enquanto o campo está vazio (nada a apontar a
                  quem ainda não escreveu), verde assim que chega aos 8, e só
                  fica vermelha se o técnico escreveu algo curto de mais.
                  Erros vindos do servidor (palavra-passe exposta em fugas)
                  passam por aqui na mesma. */}
              {errors.password?.message && errors.password.message !== lengthHint ? (
                <CustomText size="small" color="danger" classes="mt-1.5" numberOfLines={3}>
                  {errors.password.message as string}
                </CustomText>
              ) : (
                <View className="flex-row items-center mt-1.5" style={{ gap: 6 }}>
                  {isLongEnough && (
                    <View className="w-4 h-4">
                      <CheckMark color={Colors.success} />
                    </View>
                  )}
                  <CustomText
                    size="small"
                    numberOfLines={2}
                    color={isLongEnough ? 'success' : password.length > 0 ? 'danger' : 'muted'}
                  >
                    {lengthHint}
                  </CustomText>
                </View>
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
              {errors.password_confirmation && errors.password_confirmation.message && (
                <CustomText
                  size="small"
                  color="danger"
                  classes="mt-1"
                >
                  {errors.password_confirmation.message as string}
                </CustomText>
              )}
            </View>
          )}
        />
      </View>

    </View>
  )
}

export default PasswordStep;
