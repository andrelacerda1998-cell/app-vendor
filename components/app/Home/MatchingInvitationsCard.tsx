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
        className="flex-row items-center rounded-2xl border px-4 py-4"
        style={{
          // Contorno âmbar no último minuto: a diferença tem de ser visível
          // sem se ler o cartão.
          borderColor: urgent ? Colors.brand : Colors.line,
          backgroundColor: urgent ? Colors.brand_soft : Colors.card,
        }}
      >
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center"
          style={{ backgroundColor: urgent ? 'transparent' : Colors.card_high }}
        >
          <Feather name="users" size={20} color={Colors.brand} />
        </View>

        <View className="flex-1 ml-3.5 mr-2">
          {/* Contagem e finalidade juntas numa linha só, para o número ter a
              largura toda. Antes o "para responder" ficava espremido contra a
              seta. */}
          <CustomText size="small" boldness="medium" color="secondary" numberOfLines={1}>
            {count === 1
              ? t('matching.invitation.home_card_one', { count })
              : t('matching.invitation.home_card_other', { count })}
            <CustomText size="small" color="secondary" style={{ color: Colors.muted }}>
              {'  ·  '}
              {count === 1
                ? t('matching.invitation.home_expires_suffix')
                : t('matching.invitation.home_expires_suffix_soonest')}
            </CustomText>
          </CustomText>

          {/* O contador é o herói: a pergunta dele ao olhar para a Home não é
              quantos pedidos tem, é quanto tempo lhe resta.

              `tabular-nums` fixa a largura dos dígitos — sem isso o texto dança
              da esquerda para a direita a cada segundo, porque o "1" é mais
              estreito do que os outros algarismos. */}
          {!!label && (
            <CustomText
              size="headline"
              boldness="bolder"
              color="secondary"
              classes="mt-0.5"
              style={{
                color: urgent ? Colors.brand : Colors.secondary,
                fontVariant: ['tabular-nums'],
              }}
            >
              {label}
            </CustomText>
          )}
        </View>

        <Feather name="chevron-right" size={20} color={urgent ? Colors.brand : Colors.secondary} />
      </TouchableOpacity>
    </View>
  )
}

export default MatchingInvitationsCard
