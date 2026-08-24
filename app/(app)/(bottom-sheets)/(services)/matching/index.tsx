import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import TouchOpacity from '@/components/TouchOpacity';
import ArrowIcon from '@/assets/icons/arrow';
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
  const { invitations, loading, failed, submitting, refresh, accept, decline } = useMatchingInvitations();
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
        <View className="flex-row items-center justify-between mb-6">
          <TouchOpacity onPress={() => router.back()} otherClasses="h-10 w-10" itemsCenter>
            <ArrowIcon color={Colors.secondary} position="left" size="40%" />
          </TouchOpacity>
          <CustomText color="secondary" boldness="semiBold" classes="text-xl">
            {t('matching.invitation.list_title')}
          </CustomText>
          <View className="h-10 w-10" />
        </View>

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
        />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MatchingInvitations;
