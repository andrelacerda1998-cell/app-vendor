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
 * O contador ganha destaque pela PROPORÇÃO e não pelo tamanho: um número
 * enorme ocupa espaço sem dizer mais, e faz o cartão parecer um aviso de erro.
 * Aqui há um número médio e uma barra que se esvazia — a barra diz num relance
 * o que o número sozinho não diz, porque "23m" é muito ou pouco consoante a
 * janela seja de 30 minutos ou de 60 segundos.
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
    const live = invitations
      .filter((i) => !!i.expires_at)
      .sort((a, b) => String(a.expires_at).localeCompare(String(b.expires_at)));

    return live[0] ?? null;
  }, [invitations]);

  const { label, remainingRatio, urgent } = useExpiryCountdown(
    soonest?.expires_at,
    soonest?.notified_at,
  );

  const count = invitations.length;
  if (count === 0) return null;

  const accent = urgent ? Colors.brand : Colors.secondary;

  return (
    <View className="px-5 mt-3">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(app)/(bottom-sheets)/(services)/matching')}
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: urgent ? `${Colors.brand}66` : Colors.line,
          backgroundColor: Colors.card,
        }}
      >
        <View className="flex-row items-center px-4 py-4">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: Colors.brand_soft }}
          >
            <Feather name="users" size={20} color={Colors.brand} />
          </View>

          <View className="flex-1 ml-3">
            <CustomText size="medium" color="secondary" numberOfLines={1}>
              {count === 1
                ? t('matching.invitation.home_card_one', { count })
                : t('matching.invitation.home_card_other', { count })}
            </CustomText>

            {/* Número médio, não gigante. `tabular-nums` fixa a largura dos
                dígitos — sem isso o texto dança da esquerda para a direita a
                cada segundo, porque o "1" é mais estreito que os outros. */}
            {!!label && (
              <View className="flex-row items-baseline mt-0.5">
                <CustomText
                  size="subtitle"
                  boldness="bolder"
                  color="secondary"
                  style={{ color: accent, fontVariant: ['tabular-nums'] }}
                >
                  {label}
                </CustomText>
                <CustomText
                  size="small"
                  color="secondary"
                  classes="ml-2"
                  style={{ color: Colors.muted }}
                >
                  {count === 1
                    ? t('matching.invitation.home_expires_suffix')
                    : t('matching.invitation.home_expires_suffix_soonest')}
                </CustomText>
              </View>
            )}
          </View>

          <Feather name="chevron-right" size={20} color={Colors.muted} />
        </View>

        {/* A barra é o destaque real: encosta às margens do cartão e esvazia-se
            à vista, o que dá urgência sem gritar. */}
        {remainingRatio !== null && (
          <View style={{ height: 4, backgroundColor: Colors.card_high }}>
            <View
              style={{
                height: 4,
                width: `${Math.max(2, remainingRatio * 100)}%`,
                backgroundColor: urgent ? Colors.brand : Colors.muted,
              }}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

export default MatchingInvitationsCard
