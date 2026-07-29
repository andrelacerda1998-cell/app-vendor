/**
 * Como criar o subutilizador da AT.
 *
 * Este passo era o que mais gente travava: o titulo dizia "Dados da
 * Autoridade Tributaria" e as pessoas escreviam o proprio NIF e a propria
 * palavra-passe do Portal das Financas -- que da acesso a tudo, das
 * declaracoes ao IBAN. O que a Piquet precisa e de um acesso separado, criado
 * de proposito, que so serve para comunicar faturas e que pode ser apagado a
 * qualquer momento sem mexer na conta principal.
 *
 * Por isso o aviso vem antes dos campos e os passos estao aqui dentro, em vez
 * de num artigo de ajuda que ninguem abre.
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomText } from '@/components/CustomText';
import { Card } from '@/components/ui';
import { Colors } from '@/constants/Colors';

/** Portal das Financas: dai segue-se para Todos os Servicos > Gestao de Utilizadores. */
export const PORTAL_FINANCAS_URL = 'https://www.portaldasfinancas.gov.pt';

export const AtSubuserHelp = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const steps = ['portal', 'menu', 'new', 'permissions', 'password'] as const;

  return (
    <View>
      {/* Aviso primeiro: e o erro que custa mais caro. */}
      <Card
        className="flex-row"
        style={{ borderColor: 'rgba(233,162,59,0.45)' }}
      >
        <Feather name="shield" size={20} color={Colors.warning} style={{ marginTop: 2 }} />
        <View className="flex-1 ml-3">
          <CustomText color="secondary" size="small" boldness="bold" numberOfLines={2}>
            {t('complete_profile.at_user.warning.title')}
          </CustomText>
          <CustomText color="muted" size="small" classes="mt-1" numberOfLines={5}>
            {t('complete_profile.at_user.warning.body')}
          </CustomText>
        </View>
      </Card>

      <TouchableOpacity
        onPress={() => setOpen(prev => !prev)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center mt-3"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="help-circle" size={16} color={Colors.brand} />
        <CustomText color="brand" size="small" boldness="bold" classes="ml-2 flex-1" numberOfLines={2}>
          {t('complete_profile.at_user.how_to.toggle')}
        </CustomText>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.brand} />
      </TouchableOpacity>

      {open && (
        <Card className="mt-3">
          {steps.map((step, index) => (
            <View key={step} className="flex-row" style={{ marginBottom: index === steps.length - 1 ? 0 : 14 }}>
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 22, height: 22, backgroundColor: Colors.card_high, marginTop: 1 }}
              >
                <CustomText color="brand" size="extraSmall" boldness="bold">
                  {String(index + 1)}
                </CustomText>
              </View>
              <CustomText color="muted" size="small" classes="flex-1 ml-3" numberOfLines={6}>
                {t(`complete_profile.at_user.how_to.steps.${step}`)}
              </CustomText>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => Linking.openURL(PORTAL_FINANCAS_URL)}
            activeOpacity={0.85}
            accessibilityRole="link"
            accessibilityLabel={t('complete_profile.at_user.how_to.open_portal')}
            className="flex-row items-center justify-center rounded-xl mt-4 py-3"
            style={{ backgroundColor: Colors.card_high }}
          >
            <Feather name="external-link" size={16} color={Colors.brand} />
            <CustomText color="brand" size="small" boldness="bold" classes="ml-2" numberOfLines={1}>
              {t('complete_profile.at_user.how_to.open_portal')}
            </CustomText>
          </TouchableOpacity>
        </Card>
      )}
    </View>
  );
};

export default AtSubuserHelp;
