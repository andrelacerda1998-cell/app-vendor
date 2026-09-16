import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, ScrollView, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
      <View className="px-5 pt-4 pb-2">
        <CustomText size="subtitle" color="secondary" boldness="bolder">
          {t('matching.invitation.screen_title')}
        </CustomText>
        {/* A regra do jogo, dita antes de ele decidir. */}
        <CustomText size="small" color="muted" classes="mt-1" numberOfLines={2}>
          {t('matching.invitation.screen_subtitle')}
        </CustomText>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        <MatchingInvitationCard
          invitation={invitation}
          busy={submitting === invitation.candidate_id}
          onAccept={async () => { await accept(invitation.candidate_id); close(); }}
          onDecline={async () => { await decline(invitation.candidate_id); close(); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MatchingInvitationScreen;
