import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, ScrollView, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import MatchingInvitationCard from '@/components/services/MatchingInvitationCard';
import MatchingInvitationDeadlineBar from '@/components/services/MatchingInvitationDeadlineBar';
import useMatchingInvitations from '@/hooks/useMatchingInvitations';
import MatchingAcceptedContent from '@/components/services/MatchingAcceptedContent';
import { useDialog } from '@/contexts/DialogContext';

/**
 * Convite de selecao, em ecra proprio por cima de tudo.
 *
 * Porque nao uma linha numa lista: o convite chega enquanto ele esta a fazer
 * outra coisa, e a decisao demora segundos. Uma lista obriga-o a perceber
 * primeiro que ha uma lista, abri-la, e so entao ler. O ecra vem ter com ele.
 *
 * DIFERENCA PARA O `incoming-request`, que e o equivalente da adjudicacao
 * direta: este FECHA-SE ao gesto. Aceitar aqui nao e ficar com o trabalho — e
 * dizer que se esta disponivel. Nao ha nada a perder por fechar, nem motivo
 * para o prender ao ecra.
 *
 * TEM contagem decrescente, e em cima. Isto esteve escrito ao contrario aqui
 * durante algum tempo: o cartao ganhou um contador entretanto, mas a meio do
 * scroll, a seguir ao preco — so se via depois de rolar a proposta inteira, e
 * quem rola ja gastou parte daquilo que o contador esta a contar.
 *
 * A janela sao 120 segundos, iguais no imediato e no agendado. Nao o prender ao
 * ecra continua a valer; esconder-lhe quanto tempo tem, nao. Sao coisas
 * diferentes: uma e nao o obrigar a decidir ali, a outra e nao lhe dizer que ha
 * um prazo.
 */
const MatchingInvitationScreen = () => {
  const { t } = useTranslation();
  const { candidateId } = useLocalSearchParams<{ candidateId: string }>();
  const { invitations, accept, decline, submitting, loading } = useMatchingInvitations();
  const { openDialog, closeDialog } = useDialog();
  const closingRef = useRef(false);

  const invitation = useMemo(
    () => invitations.find((i) => String(i.candidate_id) === String(candidateId)),
    [invitations, candidateId],
  );

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/home');
  }, []);

  /**
   * O RESULTADO DE ACEITAR TEM DE SER DITO.
   *
   * Isto era `await accept(...)` seguido de `close()`, com o resultado deitado
   * fora. Duas coisas se perdiam, e a segunda é a grave:
   *
   *  - a confirmação "Ficaste na lista", que explica que ele ainda não tem o
   *    trabalho e que a agenda continua livre. O componente já existia e já
   *    era usado no ecrã da LISTA de convites -- só não aqui, que é o caminho
   *    de quem tem UM convite, ou seja, o caso normal;
   *
   *  - o "este pedido já fechou". Se outro profissional foi mais rápido, ou a
   *    janela fechou entretanto, o servidor diz que não. O ecrã fechava na
   *    mesma, em silêncio, e ele ficava a contar com um trabalho em que nunca
   *    entrou -- e a descobri-lo por nunca mais receber notícias.
   *
   * É o mesmo tratamento que o ecrã da lista já dava. Aqui faltava.
   */
  const onAccept = useCallback(async () => {
    if (!invitation) return;

    const result = await accept(invitation.candidate_id);

    if (result?.ok) {
      close();
      openDialog({
        closeOnClickOutside: true,
        customContent: <MatchingAcceptedContent onClose={closeDialog} />,
      });

      return;
    }

    close();
    openDialog({
      title: t('matching.invitation.too_late_title'),
      subtitle: result?.message ?? t('matching.invitation.too_late_subtitle'),
      closeOnClickOutside: true,
    });
  }, [accept, invitation, close, openDialog, closeDialog, t]);

  // So vibracao, sem som. Isto e um convite, nao um trabalho a escapar — e o
  // alarme do pedido direto existe porque la ha 60 segundos a correr.
  //
  // (O `useAlertSound` tambem nao servia: o `require("expo-av")` e icado para
  // o topo do modulo pelo Metro, por isso o try/catch que o envolve nao o
  // apanha e o ecra inteiro rebenta num build sem esse modulo nativo.)
  useEffect(() => {
    Vibration.vibrate(Platform.OS === 'android' ? [0, 250] : 250);
    return () => Vibration.cancel();
  }, []);

  // O convite desapareceu da lista (respondido noutro sitio, fechado pelo
  // servidor, ou expirado): nao ha nada a mostrar. Fecha-se em vez de deixar
  // um ecra vazio a ocupar tudo.
  useEffect(() => {
    if (!loading && !invitation) close();
  }, [loading, invitation, close]);

  if (!invitation) return null;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      {/* Fechar explicito. O ecra e um modal e arrasta-se para baixo, mas isso
          e um gesto que se descobre por acaso — e quem nao o descobre fica
          preso num ecra sem saida aparente. Fechar aqui nao perde nada: o
          convite continua vivo e volta a estar na Home. */}
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <CustomText size="subtitle" color="secondary" boldness="bolder" classes="flex-1">
          {t('matching.invitation.screen_title')}
        </CustomText>
        <TouchableOpacity
          onPress={close}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('general.close', { defaultValue: 'Fechar' })}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: Colors.card_high }}
        >
          <Feather name="x" size={18} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Fora do scroll, de proposito: um prazo que se descobre a rolar nao e
          um prazo. */}
      <MatchingInvitationDeadlineBar invitation={invitation} />

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}>
        <MatchingInvitationCard
          invitation={invitation}
          hideCountdown
          busy={submitting === invitation.candidate_id}
          onAccept={onAccept}
          onDecline={async () => { await decline(invitation.candidate_id); close(); }}
        />
      </ScrollView>

      {/* A REGRA DO JOGO, fixa no fundo.
          Estava por baixo do titulo, onde se le uma vez e nunca mais — e e
          precisamente o que responde a duvida que surge DEPOIS de ler a
          proposta: "se eu disser que sim, fico preso a isto?". Em baixo, fica
          debaixo dos olhos no momento em que ele pousa o dedo nos botoes. */}
      <View
        className="px-5 pt-3 pb-5"
        style={{ borderTopWidth: 1, borderTopColor: Colors.line, backgroundColor: Colors.bg }}
      >
        <CustomText size="small" color="muted" classes="text-center" numberOfLines={3}>
          {t('matching.invitation.screen_subtitle')}
        </CustomText>
      </View>
    </SafeAreaView>
  );
};

export default MatchingInvitationScreen;
