import React, { useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import useMatchingInvitations from '@/hooks/useMatchingInvitations'
import useExpiryCountdown from '@/hooks/useExpiryCountdown'
import { urgencyInk, urgencyOnInk, urgencyTint } from '@/utils/urgencyColor'

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

  const { label, remainingRatio, tone } = useExpiryCountdown(
    soonest?.expires_at,
    soonest?.notified_at,
  );

  const count = invitations.length;
  if (count === 0) return null;

  // A cor progride ao longo da janela toda: verde enquanto vai a tempo, âmbar
  // a meio, vermelho no fim. Responder cedo é melhor para o cliente, por isso o
  // aviso não pode ficar todo para o último minuto.
  const accent = urgencyInk(tone);

  return (
    <View className="px-5 mt-3">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(app)/(bottom-sheets)/(services)/matching')}
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: tone === 'calm' ? Colors.line : `${accent}59`,
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

        </View>

        {/* Botão explícito em vez de uma seta: o cartão inteiro já era tocável,
            mas nada dizia que havia uma AÇÃO a tomar — e a ação é o ponto. Ganha
            a cor da urgência, por isso vai aquecendo à medida que o tempo corre.

            É `View` e não `TouchableOpacity`: o toque continua a ser do cartão
            inteiro, para o alvo ser tudo e não só o botão. Um botão dentro de um
            botão dá duas áreas com comportamentos diferentes e engana o dedo. */}
        <View className="px-4 pb-4">
          <View className="rounded-xl py-3 items-center" style={{ backgroundColor: accent }}>
            <CustomText
              size="small"
              boldness="bolder"
              color="secondary"
              style={{ color: urgencyOnInk(tone) }}
            >
              {t('matching.invitation.home_cta')}
            </CustomText>
          </View>
        </View>

        {/* A barra encosta às margens do cartão e esvazia-se à vista. */}
        {remainingRatio !== null && (
          <View style={{ height: 4, backgroundColor: Colors.card_high }}>
            <View
              style={{
                height: 4,
                width: `${Math.max(2, remainingRatio * 100)}%`,
                backgroundColor: accent,
              }}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

export default MatchingInvitationsCard
