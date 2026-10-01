import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import useMatchingAwaiting from '@/hooks/useMatchingAwaiting';
import { formatQuandoAgendado } from '@/utils/serviceDetails';
import EsperaSpinner from '@/components/services/EsperaSpinner';

/**
 * "Estás à espera de N decisões."
 *
 * O vazio que isto preenche: entre dizer "tenho disponibilidade" e o cliente
 * escolher, a app não mostrava NADA. A Home ficava igual, a Agenda dizia
 * "livre" até no próprio dia do serviço, e ele só percebia que não tinha sido
 * escolhido por nunca mais receber notícias. O ecrã de confirmação promete
 * "avisamos-te assim que o cliente decidir" -- e entre a promessa e o aviso
 * não havia onde confirmar sequer que se tinha candidatado.
 *
 * NÃO É CLICÁVEL, de propósito. Não há nada para ele fazer aqui: a decisão é
 * do cliente, e não há como a apressar nem como desistir sem telefonar ao
 * suporte. Um cartão que convida ao toque e depois não leva a lado nenhum
 * ensina a ignorar os cartões todos.
 *
 * E NÃO TEM CONTADOR. O prazo do cliente existe, mas é dele, não deste ecrã:
 * pôr aqui um relógio a correr transformava uma espera tranquila -- a agenda
 * continua livre, ele não perde nada -- numa coisa com ar de urgente.
 */
const MatchingAwaitingCard = () => {
  const { t } = useTranslation();
  const { awaiting, loading } = useMatchingAwaiting();

  if (loading || awaiting.length === 0) return null;

  const total = awaiting.length;

  /**
   * Com uma candidatura diz-se QUAL, que é o que ele quer saber. Com várias,
   * o nome do primeiro não representa o conjunto e só confunde -- fica a
   * contagem.
   */
  const unica = total === 1 ? awaiting[0] : null;
  const servico = unica?.service_type?.name ?? null;
  const quando = unica
    ? formatQuandoAgendado(unica.schedule?.scheduled_day, unica.schedule?.scheduled_time_start)
    : null;

  return (
    /* `px-5 mt-3` como TODOS os outros cartões da Home (OpenService,
       PendingRequestsCard, MatchingInvitationsCard, TodayCard). Faltava, e este
       era o único a sangrar até às bordas do ecrã -- 20 px mais largo do que os
       vizinhos, com a margem esquerda a não bater certo com nenhum deles. */
    <View className="px-5">
      <View
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: Colors.line, backgroundColor: Colors.card }}
        accessibilityRole="summary"
      >
        <View className="flex-row items-center px-4 py-4">
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: Colors.card_high }}
        >
          <EsperaSpinner size={26} color={Colors.brand} />
        </View>

        {/* TRÊS linhas, por ordem do que ele quer saber:
            o QUE é (o trabalho), QUANDO é, e só depois o estado.
            Estava ao contrário -- a frase do estado em cima e o trabalho
            espremido numa linha cinzenta com a data atrás de um "·", a
            embrulhar. O trabalho é o que lhe diz se vale a pena esperar. */}
        <View className="flex-1 ml-3 items-center">
          <CustomText size="medium" color="secondary" boldness="bold" numberOfLines={2} classes="text-center">
            {servico || t('matching.awaiting.title', {
              count: total,
              defaultValue_one: 'À espera da decisão de {{count}} cliente',
              defaultValue_other: 'À espera da decisão de {{count}} clientes',
            })}
          </CustomText>

          {!!quando && (
            <CustomText size="small" color="secondary" classes="mt-0.5 opacity-80 text-center" numberOfLines={1}>
              {quando}
            </CustomText>
          )}

          <CustomText size="extraSmall" color="muted" classes="mt-1.5 text-center" numberOfLines={2}>
            {servico
              ? t('matching.awaiting.status_one', {
                  defaultValue: 'À espera da decisão do cliente',
                })
              : t('matching.awaiting.subtitle', {
                  defaultValue: 'Avisamos-te assim que decidirem. Até lá, a agenda continua livre.',
                })}
          </CustomText>
        </View>

          {/* Contrapeso com a LARGURA DO ÍCONE (56 + 12 de margem).
              Sem ele o `text-center` centra o texto no meio de uma coluna torta
              -- 68 px à esquerda, nada à direita -- e o copy fica 34 px ao lado
              do centro real do cartão. */}
          <View className="w-14 ml-3" />
        </View>
      </View>
    </View>
  );
};

export default MatchingAwaitingCard;
