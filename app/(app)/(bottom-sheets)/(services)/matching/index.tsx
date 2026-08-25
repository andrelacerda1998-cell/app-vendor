import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import TouchOpacity from '@/components/TouchOpacity';
import ArrowIcon from '@/assets/icons/arrow';
import { Feather } from '@expo/vector-icons';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { EmptyState, ErrorState, SkeletonList } from '@/components/ui';
import MatchingInvitationCard from '@/components/services/MatchingInvitationCard';
import useMatchingInvitations from '@/hooks/useMatchingInvitations';
import { useDialog } from '@/contexts/DialogContext';

/**
 * Convites de seleção abertos.
 *
 * Separado dos pedidos normais de propósito. Um pedido é trabalho adjudicado;
 * um convite é uma candidatura. Misturá-los na mesma lista faria o técnico
 * tratar os dois da mesma maneira — e a diferença é exatamente o que ele
 * precisa de perceber.
 */
const MatchingInvitations = () => {
  const { t } = useTranslation();
  const { openDialog } = useDialog();
  const { invitations, loading, failed, submitting, busiestHours, refresh, accept, decline } = useMatchingInvitations();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const onAccept = useCallback(async (candidateId: number) => {
    const result = await accept(candidateId);

    if (result.ok) {
      // Não diz "aceite" — diz o que realmente aconteceu. Prometer aqui o que
      // ainda não está garantido é o que faz o técnico sentir-se enganado
      // quando o cliente escolhe outra pessoa.
      openDialog({
        title: t('matching.invitation.accepted_title'),
        subtitle: t('matching.invitation.accepted_subtitle'),
      });

      return;
    }

    // O backend distingue "a janela fechou" de "outro foi mais rápido".
    openDialog({
      title: t('matching.invitation.too_late_title'),
      subtitle: result.message ?? t('matching.invitation.too_late_subtitle'),
    });
  }, [accept, openDialog, t]);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Envolver em flex-1 e replicar o cabeçalho de 3 partes do ecrã de
          pedidos: sem este wrapper o conteúdo era empurrado para o meio do
          ecrã, com um vazio enorme por cima do primeiro cartão. */}
      <View className="flex-1 bg-bg p-5">
        <View className="flex-row items-center justify-between mb-4">
          <TouchOpacity onPress={() => router.back()} otherClasses="h-10 w-10" itemsCenter>
            <ArrowIcon color={Colors.secondary} position="left" size="40%" />
          </TouchOpacity>
          <CustomText color="secondary" boldness="semiBold" classes="text-xl">
            {t('matching.invitation.list_title')}
          </CustomText>
          <View className="h-10 w-10" />
        </View>

        {/* O aviso vive AQUI e não dentro de cada cartão: repetido em três
            cartões era ruído, e é uma regra do ecrã inteiro — não de um pedido
            em particular. Lido uma vez, vale para todos. */}
        {!loading && !failed && invitations.length > 0 && (
          <View
            className="flex-row rounded-xl px-3.5 py-3 mb-4"
            style={{ backgroundColor: Colors.card }}
          >
            <Feather name="info" size={14} color={Colors.brand} style={{ marginTop: 2 }} />
            <CustomText
              size="extraSmall"
              color="secondary"
              classes="ml-2.5 flex-1"
              style={{ color: Colors.muted, lineHeight: 17 }}
            >
              {t('matching.invitation.explainer')}
            </CustomText>
          </View>
        )}

        {loading ? (
          <SkeletonList />
        ) : failed ? (
        <ErrorState
          title={t('matching.invitation.error_title')}
          subtitle={t('matching.invitation.error_subtitle')}
          onRetry={refresh}
        />
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => String(item.candidate_id)}
          // `flexGrow` e não `flex`: sem ele o conteúdo era empurrado para o
          // fundo do ecrã e a lista aparecia com um vazio enorme por cima.
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
          ListEmptyComponent={
            <EmptyState
              title={t('matching.invitation.empty_title')}
              subtitle={t('matching.invitation.empty_subtitle')}
            />
          }
          renderItem={({ item }) => (
            <MatchingInvitationCard
              invitation={item}
              busy={submitting === item.candidate_id}
              onAccept={() => onAccept(item.candidate_id)}
              onDecline={() => decline(item.candidate_id)}
            />
          )}
          /* Rodapé discreto com o padrão de procura. Só aparece quando o
             servidor teve amostra suficiente para o calcular — sem dados, não
             se diz nada, em vez de inventar uma hora de ponta que faria alguém
             organizar o dia à volta de nada. */
          ListFooterComponent={
            busiestHours ? (
              <View className="flex-row items-center justify-center mt-6 px-4">
                <Feather name="trending-up" size={12} color={Colors.muted} />
                <CustomText
                  size="extraSmall"
                  color="secondary"
                  classes="ml-2 text-center"
                  style={{ color: Colors.muted }}
                >
                  {t('matching.invitation.busiest_hours', {
                    from: String(busiestHours.from).padStart(2, '0'),
                    to: String(busiestHours.to).padStart(2, '0'),
                  })}
                </CustomText>
              </View>
            ) : null
          }
        />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MatchingInvitations;
