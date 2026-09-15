import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import TouchOpacity from '@/components/TouchOpacity';
import { useVendorStats } from '@/hooks/useVendorStats';
import { renderMoney } from '@/utils/money';
import { formatDayMonth } from '@/utils/date';

/**
 * "A receber" — quanto esta por transferir e em que dia entra na conta.
 *
 * Aqui esteve um cartao com as categorias subscritas. Dizia ao tecnico uma
 * coisa que ele ja sabe (escolheu-as ele) e que nao muda de mes para mes. O
 * que ele abre a app para ver e dinheiro, e isso vivia so no separador
 * Ganhos.
 *
 * Responde a duas perguntas e mais nenhuma: quanto, e quando. O detalhe
 * (que servicos, para que IBAN, o historico) fica a um toque de distancia,
 * nos Ganhos.
 *
 * Os numeros vem da mesma resposta que os totais da semana (hook
 * partilhado), por isso o cartao nao custa uma chamada a mais.
 */
const NextPaymentCard = () => {
  const { t } = useTranslation();
  const stats = useVendorStats();

  // Sem resposta ainda, ou sem data de pagamento, não se inventa um cartão.
  if (!stats?.next_payment_date) return null;

  const pending = stats.pending_payment_amount ?? 0;

  return (
    <View className="px-5">
      {/* Uma linha e uma legenda. Tinha duas seccoes separadas por um traco,
          um icone de calendario e o IBAN — tres elementos a dizer o mesmo
          assunto (quando e para onde entra o dinheiro) num cartao que so
          precisa de responder "quanto" e "quando". O IBAN nao mudou desde
          que o configurou e vive no separador Ganhos, que e onde se vai
          quando se duvida dele. */}
      <TouchOpacity
        onPress={() => router.push('/(app)/(tabs)/history')}
        bgColor="card"
        rounded="2xl"
        border
        borderColor="line"
        otherClasses="flex-row items-center p-4"
      >
        <View className="flex-1 pr-3">
          <CustomText size="medium" color="secondary" boldness="bold" numberOfLines={1}>
            {t('home.payment.title')}
          </CustomText>
          <CustomText size="small" color="muted" classes="mt-1" numberOfLines={1}>
            {t('home.payment.on_date', { date: formatDayMonth(stats.next_payment_date) })}
          </CustomText>
        </View>

        {/* Ambar so quando ha dinheiro: a cor da marca num 0,00 € celebra o
            nada e, de tanto aparecer, deixa de significar alguma coisa.
            Mesma regra dos numeros da semana aqui em cima. */}
        <CustomText
          size="extraLarge"
          color={pending > 0 ? 'brand' : 'secondary'}
          boldness="bolder"
          numberOfLines={1}
        >
          {renderMoney(pending) || '0,00 €'}
        </CustomText>

        <Feather name="chevron-right" size={18} color={Colors.muted} style={{ marginLeft: 8 }} />
      </TouchOpacity>
    </View>
  );
};

export default NextPaymentCard;
