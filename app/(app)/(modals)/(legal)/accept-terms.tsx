/**
 * Aceitação expressa dos Termos.
 *
 * Existe por uma razão legal, não de produto: os Termos passam a prever que o
 * dinheiro retido por falta do subutilizador da AT se perde ao fim de 5 dias.
 * Uma cláusula que retira dinheiro ganho só vincula quem a aceitou — e provar
 * isso exige que ela tenha sido MOSTRADA, não enterrada num "li e aceito".
 *
 * Daí o texto da cláusula estar aqui, à vista, e não só o link. O link continua
 * a existir para o documento completo.
 *
 * Não tem botão de fechar: o passo é obrigatório. Quem não aceitar continua a
 * trabalhar e a receber — a retenção não depende disto — mas o prazo da perda
 * nunca lhe arranca, porque o servidor não o conta a quem não aceitou.
 */
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Card } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { useDialog } from '@/contexts/DialogContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import XIcon from '@/assets/icons/x';
import Dialog from '@/components/Dialog';

const TERMOS_URL = 'https://piquetapp.com/termos-e-condicoes-prestadores-de-servico/';

const AcceptTerms = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData, setVendorData } = useSession();
  const { openDialog } = useDialog();

  const [aceite, setAceite] = useState(false);
  const [aGravar, setAGravar] = useState(false);

  const versao = vendorData?.terms_version_required;

  const aceitar = async () => {
    if (!aceite || !versao) return;

    setAGravar(true);
    try {
      // A VERSÃO vai no pedido: o servidor recusa se entretanto mudou. Sem
      // isto, uma app antiga registava consentimento para um texto que o
      // técnico nunca viu.
      await api.post(API_ROUTES.VENDOR_ACCEPT_TERMS, { version: versao });

      setVendorData({
        ...vendorData,
        terms_version_accepted: versao,
        terms_acceptance_required: false,
      });

      router.back();
    } catch {
      openDialog({
        icon: <XIcon color={Colors.primary} />,
        title: t('legal.accept_error.title'),
        subtitle: t('legal.accept_error.subtitle'),
        closeOnClickOutside: true,
      });
    } finally {
      setAGravar(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }}>
        <CustomText size="subtitle" color="secondary" boldness="bolder">
          {t('legal.accept.title')}
        </CustomText>
        <CustomText size="small" color="muted" classes="mt-2">
          {t('legal.accept.subtitle')}
        </CustomText>

        {/* A CLÁUSULA À VISTA.
            É a que retira dinheiro, e é a única que se mostra aqui. Mostrar o
            documento todo num ecrã destes garante que ninguém o lê — e o que se
            precisa de provar é que ESTA foi vista. */}
        <Card className="mt-5" style={{ borderWidth: 1, borderColor: 'rgba(255,90,95,0.45)' }}>
          <View className="flex-row items-center">
            <Feather name="alert-triangle" size={16} color={Colors.danger} />
            <CustomText color="secondary" size="small" boldness="bold" classes="ml-2 flex-1">
              {t('legal.accept.clause_heading')}
            </CustomText>
          </View>
          <CustomText color="muted" size="small" classes="mt-3">
            {t('legal.accept.clause_body')}
          </CustomText>
        </Card>

        <TouchableOpacity
          onPress={() => Linking.openURL(TERMOS_URL)}
          activeOpacity={0.8}
          accessibilityRole="link"
          className="flex-row items-center mt-4"
        >
          <Feather name="external-link" size={15} color={Colors.brand} />
          <CustomText color="brand" size="small" boldness="bold" classes="ml-2 flex-1">
            {t('legal.accept.read_full')}
          </CustomText>
        </TouchableOpacity>

        {/* A caixa é o consentimento; o botão é só o envio. Um botão sozinho
            "aceita" com um toque distraído. */}
        <TouchableOpacity
          onPress={() => setAceite((v) => !v)}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: aceite }}
          className="flex-row items-start mt-6"
        >
          <View
            className="items-center justify-center rounded-md"
            style={{
              width: 24, height: 24, marginTop: 2,
              borderWidth: 2,
              borderColor: aceite ? Colors.brand : Colors.line,
              backgroundColor: aceite ? Colors.brand : 'transparent',
            }}
          >
            {aceite && <Feather name="check" size={16} color={Colors.on_brand} />}
          </View>
          <CustomText color="secondary" size="small" classes="ml-3 flex-1">
            {t('legal.accept.checkbox')}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>

      <View className="px-5 pb-5">
        <CustomTouchableOpacity
          size="large"
          type="support_primary"
          textColor="primary"
          textBoldness="semiBold"
          text={aGravar ? t('legal.accept.saving') : t('legal.accept.confirm')}
          onPress={aceitar}
          disabled={!aceite || aGravar}
        />
        {!!versao && (
          <CustomText size="extraSmall" color="muted" classes="text-center mt-3">
            {t('legal.accept.version', { version: versao })}
          </CustomText>
        )}
      </View>
      {/* Este ecrã é um modal DENTRO de `(modals)`: precisa do seu próprio
          anfitrião de diálogo -- ver a pilha em DialogContext. */}
      <Dialog />
    </SafeAreaView>
  );
};

export default AcceptTerms;
