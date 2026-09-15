import React from 'react';
import { View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { SectionHeader } from '@/components/ui';
import TouchOpacity from '@/components/TouchOpacity';
import { useSession } from '@/contexts/SessionContext';
import { useVendorStats } from '@/hooks/useVendorStats';
import { renderMoney } from '@/utils/money';
import { formatLongDate } from '@/utils/date';

/** PT50 0000 0000 0000 0000 0000 0 → "PT5000 •••• 0154" */
const maskIban = (iban?: string | null) => {
  if (!iban) return null;
  const clean = String(iban).replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 6)} •••• ${clean.slice(-4)}`;
};

/**
 * "O teu dinheiro" — por receber e quando entra na conta.
 *
 * Aqui esteve um cartão com as categorias subscritas. Dizia ao técnico uma
 * coisa que ele já sabe (escolheu-as ele) e que não muda de mês para mês. O
 * que ele abre a app para ver é dinheiro: quanto já ganhou e ainda não lhe
 * foi transferido, e em que dia entra. Isso vivia só no separador Ganhos.
 *
 * Os números vêm da mesma resposta que os totais da semana (hook partilhado),
 * por isso o cartão não custa uma chamada a mais.
 */
const NextPaymentCard = () => {
  const { t } = useTranslation();
  const { vendorData } = useSession();
  const stats = useVendorStats();

  // Sem resposta ainda, ou sem data de pagamento, não se inventa um cartão.
  if (!stats?.next_payment_date) return null;

  const pending = stats.pending_payment_amount ?? 0;
  const iban = maskIban(vendorData?.iban);

  return (
    <View className="px-5">
      {/* Sem ação no cabeçalho: o cartão inteiro já abre os Ganhos, e um
          "Ver ganhos" ao lado era o mesmo destino escrito duas vezes. */}
      <SectionHeader title={t('home.payment.title')} />

      <TouchOpacity
        onPress={() => router.push('/(app)/(tabs)/history')}
        bgColor="card"
        rounded="2xl"
        border
        borderColor="line"
        otherClasses="p-4"
      >
        {/* Por receber primeiro: é o número, a data é a consequência. Só
            aparece quando há trabalho feito por pagar — a zeros seria uma
            linha a celebrar o nada. */}
        {pending > 0 && (
          <View className="flex-row items-center pb-3.5 mb-3.5" style={{ borderBottomWidth: 1, borderBottomColor: Colors.line }}>
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: 'rgba(233,162,59,0.16)' }}
            >
              <Feather name="clock" size={21} color={Colors.warning} />
            </View>
            <View className="flex-1 ml-3.5">
              <CustomText color="secondary" boldness="bold" size="medium">
                {t('earnings.pending_payment_title')}
              </CustomText>
              <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={2}>
                {t('earnings.pending_payment_subtitle', { count: stats.pending_payment_count ?? 0 })}
              </CustomText>
            </View>
            <CustomText boldness="bolder" size="large" color="secondary" style={{ color: Colors.warning }}>
              {renderMoney(pending) || '0,00 €'}
            </CustomText>
          </View>
        )}

        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: 'rgba(35,230,158,0.12)' }}
          >
            <Ionicons name="calendar-clear" size={21} color={Colors.success} />
          </View>
          <View className="flex-1 ml-3.5">
            <CustomText size="small" color="muted">
              {t('earnings.next_payment')}
            </CustomText>
            <CustomText size="medium" color="secondary" boldness="bold" classes="mt-0.5" numberOfLines={1}>
              {t('earnings.next_payment_on', { date: formatLongDate(stats.next_payment_date) })}
            </CustomText>
            <CustomText size="extraSmall" color="muted" classes="mt-0.5" numberOfLines={1}>
              {iban ? t('earnings.to_iban', { iban }) : t('earnings.next_payment_hint')}
            </CustomText>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.muted} />
        </View>
      </TouchOpacity>
    </View>
  );
};

export default NextPaymentCard;
