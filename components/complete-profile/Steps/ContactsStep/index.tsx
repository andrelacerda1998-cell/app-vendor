/**
 * Confirma os teus contactos — telemovel e email no mesmo ecra.
 *
 * Eram dois passos separados (SMS + link de email). Sao a mesma ideia para o
 * tecnico ("confirma que estes contactos sao teus"), por isso vivem agora em
 * dois cartoes num so ecra. Cada cartao tem o seu proprio fluxo:
 *  - Telemovel: envia codigo (SMS) e confirma com o codigo de 6 digitos.
 *  - Email: envia um link; a confirmacao acontece fora da app (o tecnico abre
 *    o link), por isso ha um "Ja confirmei" que recarrega o estado.
 *
 * So avanca quando os dois estao confirmados; "Faco isto mais tarde" deixa
 * seguir (o que falta continua no aviso da Home).
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { OtpInput } from 'react-native-otp-entry';
import { useTranslation } from 'react-i18next';

import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Colors } from '@/constants/Colors';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { useDialog } from '@/contexts/DialogContext';
import XIcon from '@/assets/icons/x';
import { VendorDataInterface } from '@/types/session';

/** Cartao de um contacto: cabecalho com estado (por confirmar / confirmado). */
const ContactCard = ({
  icon,
  label,
  value,
  verified,
  children,
}: {
  icon: any;
  label: string;
  value?: string | null;
  verified: boolean;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();

  // Confirmado ganha um visual RESOLVIDO — fundo e contorno verdes suaves — para
  // o olho o distinguir do que falta e ir direto ao trabalho por fazer. Antes
  // era igual ao por confirmar, com a única diferença no rótulo à direita.
  return (
    <View
      className="rounded-2xl border p-4"
      style={{
        borderColor: verified ? `${Colors.success}40` : Colors.line,
        backgroundColor: verified ? `${Colors.success}14` : Colors.card,
      }}
    >
      <View className="flex-row items-center">
        {/* Ícone numa pastilha própria quando confirmado: dá o mesmo peso ao
            "feito" que o botão âmbar dá ao "por fazer". */}
        <View
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: verified ? `${Colors.success}26` : Colors.card_high }}
        >
          <Feather name={verified ? 'check' : icon} size={17} color={verified ? Colors.success : Colors.muted} />
        </View>
        <View className="flex-1 ml-3">
          <CustomText color="muted" size="extraSmall" boldness="bold">
            {label.toUpperCase()}
          </CustomText>
          <CustomText color="secondary" size="medium" boldness="semiBold" numberOfLines={1}>
            {value || '—'}
          </CustomText>
        </View>
        {verified && (
          <CustomText color="success" size="small" boldness="bold">
            {t('complete_profile.contacts.verified')}
          </CustomText>
        )}
      </View>
      {!verified && !!children && <View className="mt-4">{children}</View>}
    </View>
  );
};

const ContactsStep = ({
  onNext,
  onSkip,
}: {
  onNext: (data: VendorDataInterface) => void;
  onSkip: () => void;
}) => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData, setVendorData, fetchAndSaveUserData } = useSession();
  const { openDialog } = useDialog();

  const [phoneOk, setPhoneOk] = useState(!!vendorData?.user?.phone_number_verified_at);
  const [emailOk, setEmailOk] = useState(!!vendorData?.user?.email_verified_at);

  const [phoneStage, setPhoneStage] = useState<'idle' | 'sent'>('idle');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [phoneBusy, setPhoneBusy] = useState(false);

  const [emailStage, setEmailStage] = useState<'idle' | 'sent'>('idle');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailPending, setEmailPending] = useState(false);

  // A confirmacao de email/telefone pode chegar por fora (link, refresh de
  // dados): mantemos os sinais locais alinhados com o vendorData.
  useEffect(() => {
    if (vendorData?.user?.phone_number_verified_at) setPhoneOk(true);
    if (vendorData?.user?.email_verified_at) setEmailOk(true);
  }, [vendorData?.user?.phone_number_verified_at, vendorData?.user?.email_verified_at]);

  const dialogError = (title: string, subtitle: string) => {
    openDialog({ icon: <XIcon color={Colors.primary} />, title, subtitle, closeAfterMSeconds: 2500, closeOnClickOutside: true });
  };

  const markPhoneVerified = (verifiedAt: string) => {
    setPhoneOk(true);
    setVendorData({ ...vendorData, user: { ...vendorData?.user, phone_number_verified_at: verifiedAt } });
  };

  // ---- Telemóvel ----
  const sendCode = () => {
    setPhoneBusy(true);
    api.get(API_ROUTES.GET_SMS_VALIDATION)
      .then(() => setPhoneStage('sent'))
      .catch((err: any) => {
        const status = err?.response?.status;
        if (status === 403) {
          markPhoneVerified(new Date().toISOString());
        } else if (status === 400) {
          // Código já enviado — segue para a introdução.
          setPhoneStage('sent');
        } else {
          dialogError(t('errors.title'), t('errors.occurred_an_error'));
        }
      })
      .finally(() => setPhoneBusy(false));
  };

  const verifyCode = () => {
    setPhoneBusy(true);
    api.post(API_ROUTES.POST_SMS_VALIDATION, { code })
      .then((res: any) => {
        const verifiedAt = res?.data?.data?.verified_at;
        if (verifiedAt) markPhoneVerified(verifiedAt);
      })
      .catch((err: any) => {
        if (err?.response?.status === 403) setCodeError(t('session.sms.error.code_invalid'));
        else dialogError(t('errors.title'), t('errors.occurred_an_error'));
      })
      .finally(() => setPhoneBusy(false));
  };

  // ---- Email ----
  const sendLink = () => {
    setEmailBusy(true);
    api.post(API_ROUTES.EMAIL_VERIFY)
      .then(() => { setEmailStage('sent'); setEmailPending(false); })
      .catch((err: any) => {
        if (err?.response?.data?.message === 'Email already verified') {
          setEmailOk(true);
          setVendorData({ ...vendorData, user: { ...vendorData?.user, email_verified_at: new Date().toISOString() } });
        } else {
          dialogError(t('errors.title'), t('errors.occurred_an_error'));
        }
      })
      .finally(() => setEmailBusy(false));
  };

  const recheckEmail = async () => {
    setEmailBusy(true);
    setEmailPending(false);
    try {
      await fetchAndSaveUserData();
      // O useEffect acima liga o emailOk quando o vendorData atualiza; se ainda
      // nao estiver confirmado, damos a dica sem tratar como erro.
      setEmailPending(true);
    } finally {
      setEmailBusy(false);
    }
  };

  const bothVerified = phoneOk && emailOk;

  return (
    <View className="flex-1 p-5">
      <View className="flex-1">
        <CustomText size="title" color="secondary" boldness="bold" numberOfLines={2}>
          {t('complete_profile.contacts.title')}
        </CustomText>
        <CustomText color="muted" classes="mt-2 mb-6" numberOfLines={3}>
          {t('complete_profile.contacts.subtitle')}
        </CustomText>

        {/* Telemóvel */}
        <ContactCard icon="smartphone" label={t('general.phone_number')} value={vendorData?.user?.phone_number} verified={phoneOk}>
          {phoneStage === 'idle' ? (
            <CustomTouchableOpacity
              size="large"
              type="support_primary"
              textColor="on_brand"
              textBoldness="semiBold"
              text={phoneBusy ? t('complete_profile.contacts.sending') : t('complete_profile.contacts.phone_send')}
              onPress={sendCode}
              disabled={phoneBusy}
            />
          ) : (
            <View>
              <CustomText color="muted" size="small" classes="mb-3">
                {t('session.sms.sent.subtitle')}
              </CustomText>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <OtpInput
                  numberOfDigits={6}
                  focusColor={Colors.brand}
                  autoFocus={false}
                  hideStick
                  blurOnFilled
                  type="numeric"
                  onTextChange={(text) => { setCode(text); if (codeError) setCodeError(null); }}
                  onFilled={(text) => { setCode(text); }}
                  textInputProps={{ accessibilityLabel: t('session.sms.sent.code') }}
                  theme={{
                    pinCodeContainerStyle: styles.pin,
                    pinCodeTextStyle: styles.pinText,
                    focusedPinCodeContainerStyle: styles.pinActive,
                    filledPinCodeContainerStyle: styles.pinFilled,
                  }}
                />
              </KeyboardAvoidingView>
              {!!codeError && (
                <CustomText size="small" color="error" classes="mt-2">{codeError}</CustomText>
              )}
              <CustomTouchableOpacity
                size="large"
                type="support_primary"
                textColor="on_brand"
                textBoldness="semiBold"
                classes="mt-4"
                text={phoneBusy ? t('complete_profile.contacts.verifying') : t('complete_profile.contacts.phone_verify')}
                onPress={verifyCode}
                disabled={phoneBusy || code.length < 6}
              />
            </View>
          )}
        </ContactCard>

        {/* Email */}
        <View className="mt-4">
          <ContactCard icon="mail" label={t('general.email')} value={vendorData?.user?.email} verified={emailOk}>
            {emailStage === 'idle' ? (
              <CustomTouchableOpacity
                size="large"
                type="support_primary"
                textColor="on_brand"
                textBoldness="semiBold"
                text={emailBusy ? t('complete_profile.contacts.sending') : t('complete_profile.contacts.email_send')}
                onPress={sendLink}
                disabled={emailBusy}
              />
            ) : (
              <View>
                <CustomText color="muted" size="small" classes="mb-1">
                  {t('complete_profile.contacts.email_sent')}
                </CustomText>
                {emailPending && (
                  <CustomText color="muted" size="small" classes="mb-1">
                    {t('complete_profile.contacts.email_not_yet')}
                  </CustomText>
                )}
                <CustomTouchableOpacity
                  size="large"
                  type="secondary_outline"
                  textColor="secondary"
                  textBoldness="semiBold"
                  classes="mt-3"
                  text={emailBusy ? t('complete_profile.contacts.checking') : t('complete_profile.contacts.email_check')}
                  onPress={recheckEmail}
                  disabled={emailBusy}
                />
              </View>
            )}
          </ContactCard>
        </View>
      </View>

      <View className="pt-5">
        <CustomTouchableOpacity
          size="large"
          type="support_primary"
          textColor="primary"
          textBoldness="semiBold"
          text={t('general.continue')}
          onPress={() => onNext(vendorData as VendorDataInterface)}
          disabled={!bothVerified}
        />
        <CustomTouchableOpacity
          size="large"
          type="transparent"
          textColor="muted"
          textSize="medium"
          textBoldness="regular"
          text={t('complete_profile.later')}
          onPress={onSkip}
          classes="self-center mt-1"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pin: {
    width: '15%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.gray_strong,
    borderRadius: 12,
  },
  pinText: { fontSize: 20, color: Colors.secondary },
  pinActive: { borderWidth: 2, borderColor: Colors.support_primary },
  pinFilled: { borderWidth: 2, borderColor: Colors.secondary },
});

export default ContactsStep;
