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
        otherClasses="flex-row items-center p-4"
      >
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: 'rgba(35,230,158,0.12)' }}
        >
          <Ionicons name="calendar-clear" size={21} color={Colors.success} />
        </View>

        <View className="flex-1 ml-3.5">
          {/* O valor primeiro, grande: e a razao de o tecnico abrir a app.
              A data logo por baixo, que sozinho um numero nao diz quando. */}
          <CustomText size="small" color="muted">
            {t('home.payment.to_receive')}
          </CustomText>
          <CustomText size="extraLarge" color="secondary" boldness="bolder" classes="mt-0.5">
            {renderMoney(pending) || '0,00 €'}
          </CustomText>
          <CustomText size="small" color="secondary" boldness="semiBold" classes="mt-1" numberOfLines={1}>
            {t('home.payment.on_date', { date: formatLongDate(stats.next_payment_date) })}
          </CustomText>
          {/* Quantos servicos compoem o valor: so quando ha algum, senao
              seria uma linha a dizer "0 servicos" por baixo de 0,00 €. */}
          {pending > 0 && (stats.pending_payment_count ?? 0) > 0 && (
            <CustomText size="extraSmall" color="muted" classes="mt-0.5" numberOfLines={1}>
              {t('earnings.pending_payment_subtitle', { count: stats.pending_payment_count })}
            </CustomText>
          )}
          {!!iban && (
            <CustomText size="extraSmall" color="muted" classes="mt-0.5" numberOfLines={1}>
              {t('earnings.to_iban', { iban })}
            </CustomText>
          )}
        </View>

        <Feather name="chevron-right" size={18} color={Colors.muted} />
      </TouchOpacity>
    </View>
  );
};

export default NextPaymentCard;
