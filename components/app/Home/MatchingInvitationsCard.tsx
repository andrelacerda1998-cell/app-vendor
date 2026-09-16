import React, { useCallback, useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import useMatchingInvitations from '@/hooks/useMatchingInvitations'
import useElapsedSince from '@/hooks/useElapsedSince'

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
  const { invitations, refresh } = useMatchingInvitations();

  // A Home tem a sua própria instância do hook; aceitar/recusar no ecrã de
  // pedidos não a atualiza. Sem isto, o cartão ficava preso na contagem antiga
  // (ex.: "4 pedidos") depois de já não haver nenhum. Refaz o fetch sempre que
  // a Home volta a ter foco.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  /** O que expira primeiro é o que manda no aviso. */
  const soonest = useMemo(() => {
    const live = invitations
      .filter((i) => !!i.expires_at)
      .sort((a, b) => String(a.expires_at).localeCompare(String(b.expires_at)));

    return live[0] ?? null;
  }, [invitations]);

  // O MESMO numero do ecra do convite: ha quanto tempo o pedido foi feito.
  //
  // Aqui mostrava-se o que FALTA e la o que ja PASSOU — dois numeros
  // diferentes para o mesmo convite, e nenhum deles explicava o outro. Quem
  // visse "18m para responder" na Home e "0:41" ao abrir ficava sem saber em
  // qual acreditar.
  const elapsed = useElapsedSince(soonest?.notified_at);
  const label = elapsed?.label ?? null;

  const count = invitations.length;
  if (count === 0) return null;

  // Uma cor só, e é a da marca.
  //
  // A cor progredia com a janela — verde, âmbar, vermelho — e a barra
  // esvaziava-se. Era a mesma promessa da contagem decrescente noutra forma:
  // que o tempo estava a correr CONTRA ele. Não está; o que corre é a fila de
  // quem já respondeu, e isso a cor não sabe mostrar.
  const accent = Colors.brand;

  return (
    <View className="px-5 mt-3">
      <TouchableOpacity
        activeOpacity={0.9}
        // Com UM convite vai direto ao ecra dele: obrigar a passar por uma
        // lista de um elemento e um toque a mais para chegar a mesma decisao.
        // Com varios, a lista e que e o sitio certo.
        onPress={() =>
          invitations.length === 1
            ? router.push({
                pathname: '/(app)/(modals)/matching-invitation/[candidateId]',
                params: { candidateId: String(invitations[0].candidate_id) },
              })
            : router.push('/(app)/(bottom-sheets)/(services)/matching')
        }
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: Colors.line,
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
                    ? t('matching.invitation.home_elapsed_suffix')
                    : t('matching.invitation.home_elapsed_suffix_soonest')}
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
              style={{ color: Colors.on_brand }}
            >
              {t('matching.invitation.home_cta')}
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default MatchingInvitationsCard
