import React, { useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import useMatchingInvitations from '@/hooks/useMatchingInvitations'
import useExpiryCountdown from '@/hooks/useExpiryCountdown'

/**
 * Atalho para os pedidos de serviço à espera de resposta.
 *
 * Mostra o contador do que está mais perto de expirar: com vários pedidos
 * abertos, o que decide se ele abre a app agora ou daqui a bocado é o mais
 * urgente, não a contagem total.
 *
 * Cartão próprio, e não juntar ao dos pedidos adjudicados: somar os dois num
 * número só faria parecer que tem N trabalhos garantidos quando não tem nenhum.
 *
 * Escondido quando não há nada.
 */
const MatchingInvitationsCard = () => {
  const { t } = useTranslation();
  const { invitations } = useMatchingInvitations();

  /** O que expira primeiro é o que manda no aviso. */
  const soonest = useMemo(() => {
    const times = invitations
      .map((i) => i.expires_at)
      .filter((e): e is string => !!e)
      .sort();

    return times[0] ?? null;
  }, [invitations]);

  const { label, urgent } = useExpiryCountdown(soonest);

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
        <Feather name="users" size={20} color={Colors.brand} />

        <View className="flex-1 ml-3 mr-2">
          <CustomText size="small" color="secondary" style={{ color: Colors.muted }}>
            {count === 1
              ? t('matching.invitation.home_card_one', { count })
              : t('matching.invitation.home_card_other', { count })}
          </CustomText>

          {/* O contador é o elemento dominante: a pergunta dele ao olhar para a
              Home não é quantos pedidos tem, é quanto tempo lhe resta. O número
              fica grande, e a etiqueta pequena por cima. */}
          {!!label && (
            <View className="flex-row items-baseline mt-0.5">
              <CustomText
                size="large"
                boldness="bolder"
                color="secondary"
                style={{ color: urgent ? Colors.brand : Colors.secondary, fontVariant: ['tabular-nums'] }}
              >
                {label}
              </CustomText>
              <CustomText size="extraSmall" color="secondary" classes="ml-1.5" style={{ color: Colors.muted }}>
                {count === 1
                  ? t('matching.invitation.home_expires_suffix')
                  : t('matching.invitation.home_expires_suffix_soonest')}
              </CustomText>
            </View>
          )}
        </View>

        <Feather name="chevron-right" size={20} color={Colors.muted} />
      </TouchableOpacity>
    </View>
  )
}

export default MatchingInvitationsCard
