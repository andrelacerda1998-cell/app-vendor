import CheckMark from '@/assets/icons/check-mark'
import XIcon from '@/assets/icons/x'
import { CustomText } from '@/components/CustomText'
import CustomTextInput from '@/components/CustomTextInput'
import DatePicker from '@/components/DatePicker'
import { Colors } from '@/constants/Colors'
import { Feather, FontAwesome6 } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { Control, Controller, FieldErrors, FieldValues, set } from 'react-hook-form'
import { Pressable, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { ScrollView } from 'react-native'
import { commonPasswords } from '@/utils'
import { useTranslation } from "react-i18next"

const PasswordStep = ({
  control,
  errors
}: {
  control: any,
  errors: FieldErrors<FieldValues>,
}) => {
  const { t } = useTranslation();
  /**
   * A lista que se vê É a lista de regras — não há nenhuma escondida.
   *
   * Antes o símbolo era exigido sem estar na checklist: a lista dizia tudo ✓
   * verde e aparecia um erro vermelho por baixo dos DOIS campos, vindo de uma
   * regra que não estava escrita em lado nenhum. Deixou de ser exigido
   * (decisão do André) — o servidor nunca o pediu: `Password::min(8)
   * ->uncompromised()` (CreateVendorRequest) é comprimento e não estar em
   * fugas de dados conhecidas.
   *
   * Sobram duas verificações fora da lista, e são de outra natureza: a
   * palavra-passe comum e a confirmação. Essas não são "requisitos a cumprir"
   * — são enganos, e aparecem como erro no campo onde o engano está.
   */
  const wrongPassword = {
    MINIMUM: t('general.password_min_length'),
    UPPERCASE: t('general.password_uppercase'),
    LOWERCASE: t('general.password_lowercase'),
    NUMBER: t('general.password_number'),
    COMMON: t('general.password_common'),
    MATCH: t('general.password_match'),
  }
  const [passwordErrors, setPasswordErrors] = useState({
    MINIMUM: true,
    UPPERCASE: true,
    LOWERCASE: true,
    NUMBER: true,
    COMMON: true,
    MATCH: true,
  });

  /**
   * O que a lista MOSTRA — e não o que é verificado.
   *
   * O símbolo, a palavra-passe comum e a confirmação continuam a ser
   * validados (bloqueiam o "Finalizar" e aparecem a vermelho por baixo do
   * campo); só saíram da checklist, que ficava com sete linhas antes de a
   * pessoa escrever a primeira letra. Deixar de os VERIFICAR seria outra
   * coisa: a palavra-passe comum é rejeitada pelo servidor
   * (Password::uncompromised) e a confirmação também (password.confirmed) —
   * o erro apareceria no fim do registo, sem dizer em que campo.
   */
  const VISIBLE_RULES = ['MINIMUM', 'UPPERCASE', 'LOWERCASE', 'NUMBER'] as const;
  /**
   * Quantos caracteres faltam para os 8. "Pelo menos 8 caracteres" obriga a
   * pessoa a contar o que escreveu; dizer "faltam 3" poupa-lhe isso.
   */
  const [missingChars, setMissingChars] = useState(8);
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (field?: 'password' | 'password_confirmation') => {
    const password = control._formValues.password;
    const password_confirmation = control._formValues.password_confirmation;
    const errors = {
      MINIMUM: password.length < 8,
      UPPERCASE: !/[A-Z]/.test(password),
      LOWERCASE: !/[a-z]/.test(password),
      NUMBER: !/[0-9]/.test(password),
      COMMON: commonPasswords.includes(password),
      MATCH: password !== password_confirmation,
    };

    setPasswordErrors(errors);
    setMissingChars(Math.max(0, 8 - password.length));

    // Cada erro aparece no campo onde se corrige, e uma só vez.
    //
    // Os dois campos partilham esta validação; sem separar por campo, o mesmo
    // aviso saía por baixo dos DOIS ("Um símbolo" repetido, no ecrã que deu
    // origem a isto). E o que já está na checklist não se repete debaixo do
    // campo — estaria escrito duas vezes com dois centímetros de intervalo.
    if (field === 'password_confirmation') {
      return errors.MATCH ? wrongPassword.MATCH : true;
    }

    if (errors.COMMON) {
      return wrongPassword.COMMON;
    }

    // O resto está todo na checklist: marca o campo como inválido (bloqueia o
    // "Criar conta") sem escrever nada por baixo dele.
    const falhaNaLista = (VISIBLE_RULES as readonly string[]).some(
      (key) => errors[key as keyof typeof errors],
    );

    return falhaNaLista || errors.MATCH ? false : true;
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

      {/* O "nome de utilizador" saiu daqui: não fazia sentido para quem se
          inscreve como profissional (o login é por email — ver LoginController),
          e o backend já o gera a partir do nome desde que a validação passou a
          `nullable` (ver CreateVendorController::generateUsername). Era um campo
          a mais a pedir a alguém que só quer começar a trabalhar. */}

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
            validate: () => validatePassword('password')
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
            validate: () => validatePassword('password_confirmation')
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
          VISIBLE_RULES.map((key) => (
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
                {key === 'MINIMUM' && missingChars > 0 && missingChars < 8
                  ? t('general.password_min_length_missing', { count: missingChars })
                  : wrongPassword[key as keyof typeof wrongPassword]}
              </CustomText>
            </View>
          ))
        }
      </View>
    </View>
  )
}

export default PasswordStep;