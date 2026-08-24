import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import useMatchingInvitations from '@/hooks/useMatchingInvitations'

/**
 * Convites de seleção à espera de resposta.
 *
 * Cartão próprio, e não juntar ao dos pedidos pendentes: um pedido é trabalho
 * adjudicado, um convite é uma candidatura. Somar os dois num número só faria
 * o técnico pensar que tem N trabalhos garantidos quando não tem nenhum.
 *
 * Escondido quando não há nada — como o dos pedidos.
 */
const MatchingInvitationsCard = () => {
  const { t } = useTranslation();
  const { invitations } = useMatchingInvitations();

  const count = invitations.length;
  if (count === 0) return null;

  return (
    <View className="px-5 mt-3">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/(app)/(bottom-sheets)/(services)/matching')}
        className="flex-row items-center rounded-2xl border p-4"
        style={{ borderColor: Colors.line, backgroundColor: Colors.card }}
      >
        <Feather name="users" size={22} color={Colors.brand} />
        <View className="flex-1 ml-3">
          <CustomText color="secondary" boldness="bold" numberOfLines={2}>
            {count === 1
              ? t('matching.invitation.home_card_one', { count })
              : t('matching.invitation.home_card_other', { count })}
          </CustomText>
          <CustomText size="extraSmall" color="secondary" style={{ color: Colors.muted }}>
            {t('matching.invitation.home_card_hint')}
          </CustomText>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.secondary} />
      </TouchableOpacity>
    </View>
  )
}

export default MatchingInvitationsCard
