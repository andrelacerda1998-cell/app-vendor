import React from 'react'
import { TouchableOpacity, View } from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import { CustomText } from "./CustomText"
import { Feather } from "@expo/vector-icons"
import { Colors } from "@/constants/Colors"
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next"
import { cardShadow } from "@/components/ui"
import { useSession } from "@/contexts/SessionContext"
import { dinheiroRetidoPelaAt, jaExecutouServicos, pedeAtNoPerfil } from "@/utils/atPayout"

/**
 * Aviso de perfil incompleto — bloqueia a receção de pedidos, por isso tem de
 * saltar à vista.
 *
 * Em ambar, nao em vermelho. Vermelho diz "esta partido" ou "vais perder algo";
 * isto e uma tarefa por acabar. E como so desaparece quando o perfil estiver
 * completo, o tecnico abria a app durante dias com um alarme a gritar por uma
 * coisa que depende dele fazer com calma. Continua a ser o unico elemento
 * colorido acima da dobra, por isso nao se perde.
 */
const CompleteYourProfile = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { vendorData } = useSession();

  /**
   * O que falta em concreto, pela mesma ordem do ecrã de Estado da conta.
   * Dizer "completa o teu perfil" sem dizer o quê obrigava o técnico a entrar
   * e procurar. A morada de faturação é o caso mais silencioso: sem ela, a
   * criação da conta de faturação rebenta no InvoiceXpress e ele nunca fica
   * online, sem nada na app que o explique.
   */
  const missing: string[] = [];
  if ((vendorData?.missing_documents?.length ?? 0) > 0) missing.push(t('complete_profile.missing.documents'));
  if (!vendorData?.user?.phone_number_verified_at) missing.push(t('complete_profile.missing.phone'));
  if (!vendorData?.user?.email_verified_at) missing.push(t('complete_profile.missing.email'));
  // A AT so conta como passo em falta quando ja e exigida (a partir do 3.o
  // servico concluido). Antes disso somava um passo que o tecnico nao tem de
  // dar, e a contagem mentia: "faltam 2" quando so falta 1.
  if (pedeAtNoPerfil(vendorData?.at_user, vendorData?.at_required)) missing.push(t('complete_profile.missing.at_user'));
  if (!vendorData?.company_address) missing.push(t('complete_profile.missing.company_address'));
  if (!vendorData?.iban) missing.push(t('complete_profile.missing.iban'));

  /**
   * Contagem em vez da lista toda. Enumerar tudo separado por " · " nao cabia
   * no cartao: cortava a meio ("morada de faturacao…") e o tecnico nem chegava
   * a ler o que faltava. O detalhe esta a um toque, no ecra seguinte.
   */
  /**
   * "COMECARES a receber pedidos" nao serve a quem ja recebeu.
   *
   * Este cartao nasceu para o onboarding, e o texto era so o de entrada. Mas com
   * a regra da AT ele aparece tambem a quem ja concluiu tres servicos -- e
   * dizer-lhe "completa o perfil para comecares a receber pedidos" e negar o
   * trabalho que ele ja fez. Para esse, o perfil incompleto nao e a porta de
   * entrada: e uma porta que se fechou. Dai "VOLTARES a receber".
   */
  const jaTrabalhou = jaExecutouServicos(vendorData?.at_required, vendorData?.services_until_at_required);

  const subtitle = missing.length > 0
    ? t(
        jaTrabalhou
          ? (missing.length === 1 ? 'complete_profile.missing_again_one' : 'complete_profile.missing_again_many')
          : (missing.length === 1 ? 'complete_profile.missing_one' : 'complete_profile.missing_many'),
        { count: missing.length },
      )
    : t('complete_profile.subtitle');

  /**
   * Procura recente na zona do técnico (últimos 7 dias), vinda do backend.
   * "Faltam 3 passos" é uma tarefa; "houve 12 pedidos na tua zona" é o que ele
   * está a perder por não a fazer — a mesma alavanca já usada na
   * auto-aceitação. Só aparece com número real: sem zonas escolhidas ou sem
   * procura, o backend manda 0/null e não se inventa nada.
   */
  const zoneRequests = vendorData?.zone_recent_requests ?? 0;

  /**
   * Dinheiro dele, ja ganho, parado a espera da AT.
   *
   * Tinha banner proprio, a vermelho, mesmo por cima deste. Eram duas caixas a
   * falar do MESMO passo em falta e a competir pelo mesmo toque -- e a vermelha
   * ganhava por cor, nao por importancia. Passa a ser a faixa de baixo deste
   * cartao, que e exactamente o sitio que ja existia para "o que estas a perder
   * por nao completares isto".
   *
   * Ganha a prioridade sobre a procura na zona quando as duas sao verdade:
   * pedidos que PODIAM aparecer valem menos do que dinheiro que ja e dele.
   */
  const dinheiroRetido = dinheiroRetidoPelaAt(vendorData?.payout_blocked_by_at);

  /**
   * Com dinheiro retido o cartao INTEIRO passa a vermelho.
   *
   * Ate aqui era so a faixa de baixo, e a leitura saia trocada: um cartao ambar
   * le-se como "tarefa por acabar, trata disso quando puderes", e e exactamente
   * o que ele NAO deve pensar quando ja trabalhou e tem dinheiro parado. Ambar
   * e a versao de quem ainda nao perdeu nada.
   *
   * O vermelho sai do token da app (`Colors.danger`, #FF5A5F) e nao de um hex
   * escrito a mao. A faixa usava `rgba(218,64,64,…)`, que e do banner da AT
   * invalida -- dois vermelhos parecidos e diferentes no mesmo ecra.
   */
  const VERMELHO = '255,90,95';   // Colors.danger
  const AMBAR = '250,187,91';     // Colors.brand
  const tom = dinheiroRetido ? VERMELHO : AMBAR;
  const corPrincipal = dinheiroRetido ? Colors.danger : Colors.brand;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/(app)/(complete-profile)/CompleteProfile')}
    >
      <LinearGradient
        colors={[`rgba(${tom},0.26)`, `rgba(${tom},0.08)`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          { borderRadius: 16, borderWidth: 1.5, borderColor: `rgba(${tom},0.52)` },
          cardShadow,
        ]}
      >
        <View className="flex-row items-center p-4">
          <View
            className="w-11 h-11 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: corPrincipal }}
          >
            {/* Triangulo e nao cadeado: o titulo continua a ser uma tarefa
                por acabar. O cadeado e da linha do dinheiro, la em baixo --
                dois cadeados no mesmo cartao seriam o mesmo simbolo a dizer
                duas coisas. */}
            <Feather name="alert-triangle" size={22} color={Colors.on_brand} />
          </View>
          <View className="flex-1">
            <CustomText size="medium" color="secondary" boldness="bolder" numberOfLines={2}>
              {t('complete_profile.notice')}
            </CustomText>
            <CustomText size="small" color="secondary" boldness="regular" numberOfLines={3} classes="mt-0.5 opacity-80">
              {subtitle}
            </CustomText>
          </View>
          <Feather name="chevron-right" size={22} color={corPrincipal} />
        </View>

        {/* A cor ja veio de cima (o cartao todo), por isso aqui basta o traco a
            separar. Procura na zona e dinheiro retido sao coisas de natureza
            oposta -- uma e oportunidade ("podias estar a ganhar"), a outra e
            perda a acontecer ("ja ganhaste e nao o tens") -- e e por isso que
            so a segunda pinta o cartao. */}
        {(dinheiroRetido || zoneRequests > 0) && (
          <View
            className={`flex-row items-center px-4 py-2.5 ${dinheiroRetido ? 'justify-center' : ''}`}
            style={{ borderTopWidth: 1, borderTopColor: `rgba(${tom},0.34)` }}
          >
            {/* A linha do dinheiro vai CENTRADA; a da procura na zona fica
                encostada a esquerda.

                Nao e inconsistencia: a do dinheiro sao quatro palavras e cabe
                sempre numa linha, e centrada le-se como um selo. A da zona
                cresce com o numero ("houve 12 pedidos na tua zona") e passa a
                duas linhas -- centrar texto que embrulha da um bloco com as
                pontas irregulares, que e pior do que alinhado.

                `flexShrink` em vez de `flex-1`: com `flex-1` o texto ocupava o
                espaco todo depois do icone e o "centro" ficava a direita do
                centro real do cartao. Assim o par icone+frase centra-se como um
                bloco, e encolhe se algum dia precisar. */}
            <Feather name={dinheiroRetido ? 'lock' : 'trending-up'} size={15} color={corPrincipal} />
            <CustomText
              size="small"
              color="secondary"
              boldness="semiBold"
              classes={dinheiroRetido ? 'ml-2' : 'ml-2 flex-1'}
              numberOfLines={dinheiroRetido ? 1 : 2}
              style={dinheiroRetido ? { flexShrink: 1 } : undefined}
            >
              {dinheiroRetido
                ? t('complete_profile.money_on_hold')
                : t('complete_profile.zone_demand', { count: zoneRequests })}
            </CustomText>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )
}

export default CompleteYourProfile
