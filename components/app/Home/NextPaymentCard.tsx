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
        {/* Linha do valor: rótulo à esquerda, montante à direita, como num
            extrato. Antes era uma coluna encostada ao ícone, com metade da
            largura do cartão vazia à direita — o número mais importante do
            ecrã a viver num canto. */}
        <View className="flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            {/* Sem rótulo aqui dentro: o cabeçalho da secção já diz "A
                receber", e repeti-lo a dois centímetros era a mesma frase
                duas vezes a roubar espaço ao número. */}
            {/* Âmbar só quando há dinheiro: a cor da marca num 0,00 € celebra
                o nada, e de tanto aparecer deixa de significar alguma coisa.
                Mesma regra dos números da semana aqui em cima. */}
            <CustomText
              size="extraLarge"
              color={pending > 0 ? 'brand' : 'secondary'}
              boldness="bolder"
              classes="mt-0.5"
              numberOfLines={1}
            >
              {renderMoney(pending) || '0,00 €'}
            </CustomText>
          </View>
          {/* Quantos serviços compõem o valor — em pastilha, junto ao número
              a que diz respeito. Só quando há algum. */}
          {pending > 0 && (stats.pending_payment_count ?? 0) > 0 && (
            <View className="rounded-full px-2.5 py-1 mb-1" style={{ backgroundColor: Colors.card_high }}>
              <CustomText size="extraSmall" color="muted" boldness="semiBold" numberOfLines={1}>
                {t('home.payment.services_count', { count: stats.pending_payment_count })}
              </CustomText>
            </View>
          )}
        </View>

        {/* Linha do pagamento: quando entra e para onde. */}
        <View
          className="flex-row items-center mt-3.5 pt-3.5"
          style={{ borderTopWidth: 1, borderTopColor: Colors.line }}
        >
          <Ionicons name="calendar-clear" size={17} color={Colors.success} />
          <View className="flex-1 ml-2.5">
            <CustomText size="small" color="secondary" boldness="semiBold" numberOfLines={1}>
              {t('home.payment.on_date', { date: formatLongDate(stats.next_payment_date) })}
            </CustomText>
            {!!iban && (
              <CustomText size="extraSmall" color="muted" classes="mt-0.5" numberOfLines={1}>
                {t('earnings.to_iban', { iban })}
              </CustomText>
            )}
          </View>
          <Feather name="chevron-right" size={18} color={Colors.muted} />
        </View>
      </TouchOpacity>
    </View>
  );
};

export default NextPaymentCard;
