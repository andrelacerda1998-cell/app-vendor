import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, ScrollView, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import MatchingInvitationCard from '@/components/services/MatchingInvitationCard';
import useMatchingInvitations from '@/hooks/useMatchingInvitations';

/**
 * Convite de selecao, em ecra proprio por cima de tudo.
 *
 * Porque nao uma linha numa lista: o convite chega enquanto ele esta a fazer
 * outra coisa, e a decisao demora segundos. Uma lista obriga-o a perceber
 * primeiro que ha uma lista, abri-la, e so entao ler. O ecra vem ter com ele.
 *
 * DIFERENCA PARA O `incoming-request`, que e o equivalente da adjudicacao
 * direta: este NAO tem contagem decrescente e FECHA-SE ao gesto. Aceitar aqui
 * nao e ficar com o trabalho — e dizer que se esta disponivel. Nao ha nada a
 * perder por fechar, nem motivo para o prender ao ecra.
 */
const MatchingInvitationScreen = () => {
  const { t } = useTranslation();
  const { candidateId } = useLocalSearchParams<{ candidateId: string }>();
  const { invitations, accept, decline, submitting, loading } = useMatchingInvitations();
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

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 16 }}>
        <MatchingInvitationCard
          invitation={invitation}
          busy={submitting === invitation.candidate_id}
          onAccept={async () => { await accept(invitation.candidate_id); close(); }}
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
