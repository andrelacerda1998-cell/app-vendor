import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';

/**
 * Quanto tempo o CLIENTE ainda tem para escolher e pagar.
 *
 * Não é o prazo dele — é o do outro lado, e é por isso que esta linha existe:
 * "à espera" sem fim à vista é o que faz alguém deixar de responder a pedidos.
 * Saber que faltam quatro minutos é diferente de não saber se falta uma hora
 * ou um dia.
 *
 * O instante vem do servidor (`customer_deadline`), do mesmo método que
 * alimenta o contador no ecrã do cliente. Contar aqui a partir de outra conta
 * daria dois relógios a dizer coisas diferentes sobre o mesmo prazo.
 *
 * SEM ÍCONE. A frase já diz o que é, e um símbolo a animar ao lado de um
 * número que muda a cada segundo são duas coisas em movimento a disputar o
 * mesmo olhar.
 *
 * VERDE enquanto corre, e não vermelho a aproximar-se do fim.
 *
 * É a convenção que a app já tem para contadores -- no cartão de pedido o
 * tempo que falta é verde e só passa a vermelho nos últimos dez segundos,
 * quando ele TEM de agir. Aqui nunca tem: o tempo a esgotar-se não é problema
 * dele e não pode fazer nada, por isso o vermelho nunca chega. O verde dá-lhe
 * o destaque que faltava sem lhe pedir uma reação que não existe.
 */
const PrazoDoCliente = ({
  deadline,
  /**
   * No cartão da Agenda esta linha é informação a sério e acompanha o resto
   * em branco; noutros sítios continua discreta.
   */
  destacado = false,
}: { deadline?: string | null; destacado?: boolean }) => {
  const { t } = useTranslation();
  const fim = deadline ? Date.parse(deadline) : NaN;
  const [agora, setAgora] = useState(() => Date.now());

  const valido = Number.isFinite(fim) && fim > 0;

  useEffect(() => {
    if (!valido) return;
    const id = setInterval(() => setAgora(Date.now()), 1000);

    return () => clearInterval(id);
  }, [valido]);

  if (!valido) return null;

  const restaMs = fim - agora;

  /**
   * Prazo acabado: NÃO mostra nada.
   *
   * Dizia "O prazo do cliente terminou" e ficava lá -- mas quem já não tem
   * decisão à espera não devia sequer estar nesta lista. O cartão inteiro sai
   * (ver `useMatchingAwaiting`), e esta linha a anunciar o fim era o que fazia
   * a Agenda e a Home contradizerem-se durante o intervalo entre leituras.
   */
  if (restaMs <= 0) return null;

  /**
   * Acima de uma hora mostram-se horas e minutos, abaixo minutos e segundos.
   * "73:45" não se lê; "1h 13m" lê-se de relance, que é tudo o que esta linha
   * precisa de ser.
   */
  const etiqueta = (() => {
    const total = Math.max(0, Math.floor(restaMs / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sg = total % 60;

    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;

    return `${m}:${String(sg).padStart(2, '0')}`;
  })();

  return (
    <View className="mt-2">
      <CustomText
        size={destacado ? 'small' : 'extraSmall'}
        color="success"
        boldness={destacado ? 'bold' : 'regular'}
        classes={destacado ? '' : 'opacity-80'}
        numberOfLines={1}
      >
        {t('matching.awaiting.customer_deadline', {
          time: etiqueta,
          defaultValue: '{{time}} para o cliente escolher e pagar',
        })}
      </CustomText>
    </View>
  );
};

export default PrazoDoCliente;
