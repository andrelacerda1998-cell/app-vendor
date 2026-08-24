/**
 * Entrada da app.
 *
 * O primeiro ecrã e o de iniciar sessao, nao um ecra de boas-vindas: quem abre
 * esta app e um tecnico que ja tem conta e quer ver o trabalho do dia. O
 * ecra intermedio custava um toque a toda a gente, todos os dias, para servir
 * uma minoria que se regista uma vez na vida -- e a criacao de conta continua
 * aqui em baixo, sem se perder.
 *
 * E a raiz de (auth), por isso e tambem onde caem o fim de sessao, a sessao
 * expirada e o fim da recuperacao de palavra-passe.
 */
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { View, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import AdaptiveLogo from "@/assets/svgs/adptive-logo";
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { Colors } from "@/constants/Colors";
import { useApi } from "@/contexts/ApiContext";
import { useSession } from "@/contexts/SessionContext";
import { API_ROUTES } from "@/constants/ApiRoutes";

/**
 * Campo com icone, borda vermelha em erro e mensagem por baixo.
 *
 * Tem de ficar FORA do ecra: definido la dentro, era um tipo de componente
 * novo a cada render, o React desmontava o TextInput a cada tecla e o campo
 * perdia o foco depois da primeira letra.
 */
const Field = ({
  icon,
  error,
  children,
}: {
  icon: keyof typeof Feather.glyphMap;
  error?: string;
  children: React.ReactNode;
}) => (
  <View>
    <View
      className="flex-row items-center rounded-2xl bg-card border px-4"
      style={{ borderColor: error !== undefined ? Colors.danger : Colors.line, height: 56 }}
    >
      <Feather name={icon} size={20} color={error !== undefined ? Colors.danger : Colors.muted} />
      {children}
    </View>
    {!!error && (
      <CustomText size="small" color="danger" classes="mt-1.5" numberOfLines={3}>
        {error}
      </CustomText>
    )}
  </View>
);

const SignIn = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { setSession } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { control, handleSubmit, formState: { errors }, setError } = useForm({
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  async function signIn(data: { email: string, password: string }) {
    setIsLoggingIn(true);
    try {
      const response = await api.post(API_ROUTES.AUTH_LOGIN, {
        email: data.email.trim(),
        password: data.password,
        type: 'vendor',
      });
      const { access_token } = response?.data.data;

      if (access_token) {
        setSession(access_token);
      }
    } catch (error) {
      // O erro vive no campo da palavra-passe, que e onde esta o cursor e o
      // que quase sempre falha; o do email fica vazio so para o marcar a
      // vermelho tambem, ja que nao sabemos qual dos dois esta errado.
      const message = axios.isAxiosError(error) && (error.response?.status === 500 || error.response?.status === 503)
        ? t('errors.server_error')
        : axios.isAxiosError(error) && error.response
          ? t('errors.invalid_email_or_password')
          : t('errors.network');

      setError('email', { type: 'manual', message: '' });
      setError('password', { type: 'manual', message });
    }
    setIsLoggingIn(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg px-6">
      <StatusBar backgroundColor={Colors.bg} style="light" />

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marca: o mesmo simbolo da app, nao um icone generico de ferramentas. */}
        <View className="items-center">
          <View className="w-[72px] h-[72px] rounded-[20px] bg-support_primary p-4 items-center justify-center">
            <AdaptiveLogo color={Colors.primary} />
          </View>
          <CustomText size="title" color="secondary" boldness="bolder" classes="mt-6 text-center" numberOfLines={2}>
            {t('auth.sign_in.title')}
          </CustomText>
          <CustomText size="medium" color="muted" classes="mt-2 text-center" numberOfLines={2}>
            {t('auth.sign_in.subtitle')}
          </CustomText>
        </View>

        <View className="mt-9" style={{ gap: 14 }}>
          <Controller
            control={control}
            name="email"
            rules={{
              required: t('general.email_required'),
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: t('general.email_invalid') },
            }}
            render={({ field }) => (
              <Field icon="mail" error={errors.email?.message}>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  returnKeyType="next"
                  placeholder={t('general.email_placeholder')}
                  placeholderTextColor={Colors.muted}
                  accessibilityLabel={t('general.email')}
                  className="flex-1 ml-3"
                  style={{ color: Colors.secondary, fontFamily: 'Poppins_500Medium', fontSize: 16 }}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: t('general.password_required') }}
            render={({ field }) => (
              <Field icon="lock" error={errors.password?.message}>
                <TextInput
                  value={field.value}
                  onChangeText={(value: string) => field.onChange(value.replace(/\s/g, ''))}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  textContentType="password"
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(signIn)}
                  placeholder={t('auth.sign_in.password_placeholder')}
                  placeholderTextColor={Colors.muted}
                  accessibilityLabel={t('general.password')}
                  className="flex-1 ml-3"
                  style={{ color: Colors.secondary, fontFamily: 'Poppins_500Medium', fontSize: 16 }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('general.toggle_password_visibility')}
                  accessibilityState={{ expanded: showPassword }}
                  className="w-9 h-full items-center justify-center"
                >
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={Colors.muted} />
                </TouchableOpacity>
              </Field>
            )}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          disabled={isLoggingIn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          className="self-end mt-4"
        >
          <CustomText size="small" color="muted" boldness="medium" numberOfLines={1}>
            {t('auth.sign_in.forgot_password')}
          </CustomText>
        </TouchableOpacity>

        {/* Sempre ativo: um botao apagado antes de escrever le-se como avariado,
            e quem escreve mal so descobre porque quando o toca. A validacao
            corre ao submeter e aponta o campo errado. */}
        <CustomTouchableOpacity
          type="support_primary"
          size="large"
          text={isLoggingIn ? t('auth.sign_in.signing_in') : t('auth.sign_in.sign_in')}
          textSize="medium"
          textColor="on_brand"
          textBoldness="bold"
          onPress={handleSubmit(signIn)}
          disabled={isLoggingIn}
          classes="mt-7"
        />

        <View className="flex-row items-center justify-center mt-6">
          <CustomText size="medium" color="muted">
            {t('auth.sign_in.no_account')}
          </CustomText>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            disabled={isLoggingIn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
          >
            <CustomText size="medium" color="support_primary" boldness="bold" classes="ml-1.5">
              {t('auth.home.create_account')}
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
