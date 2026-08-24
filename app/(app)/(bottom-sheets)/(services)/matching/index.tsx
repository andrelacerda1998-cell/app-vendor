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
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <View className="flex-row items-center px-5 py-4">
        <TouchOpacity onPress={() => router.back()} className="mr-3">
          <ArrowIcon color={Colors.secondary} position="left" size="40%" />
        </TouchOpacity>
        <CustomText size="large" boldness="bolder" color="secondary">
          {t('matching.invitation.list_title')}
        </CustomText>
      </View>

      {loading ? (
        <View className="px-5">
          <SkeletonList />
        </View>
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
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
    </SafeAreaView>
  );
};

export default MatchingInvitations;
