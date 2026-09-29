import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import useExpiryCountdown from '@/hooks/useExpiryCountdown';
import { MatchingInvitation } from '@/types/matching';

/**
 * Os 120 segundos do convite, no topo do ecrã e antes de tudo o resto.
 *
 * O contador já existia — dentro do cartão, a meio, a seguir ao preço. Aí só
 * se vê depois de rolar a proposta inteira, e quem rola já gastou uma parte
 * daquilo que o contador está a contar.
 *
 * Esta é a informação que ele não consegue adivinhar e a única que muda o
 * comportamento: saber que tem dois minutos é o que faz responder agora em vez
 * de "daqui a bocado". Por isso vem em cima, fixa, fora do scroll.
 *
 * O NÚMERO É DO SERVIDOR. O `useExpiryCountdown` corrige o desvio do relógio do
 * telemóvel pelo `server_time` que vem no mesmo payload: numa janela de 120 s,
 * trinta segundos de desvio são um quarto do tempo visível.
 *
 * Espelha a barra do cliente (`MatchingDeadlineBar` na app do cliente): são o
 * mesmo momento visto dos dois lados, e não havia razão para se parecerem
 * diferentes.
 */
const MatchingInvitationDeadlineBar = ({ invitation }: { invitation: MatchingInvitation }) => {
  const { t } = useTranslation();
  const countdown = useExpiryCountdown(
    invitation.expires_at,
    invitation.notified_at,
    invitation.server_time,
  );

  if (!countdown.label) return null;

  /**
   * A cor progride ao longo de TODA a janela e não só no fim: responder cedo é
   * melhor para o cliente, que escolhe mais depressa e espera menos. Guardar o
   * aviso para os últimos segundos seria premiar quem responde tarde.
   */
  const cor =
    countdown.tone === 'critical'
      ? Colors.danger
      : countdown.tone === 'warning'
        ? Colors.warning
        : Colors.brand;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${countdown.label} ${t('matching.invitation.window')}`}
      className="px-5 pt-3 pb-3"
      style={{
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.line,
      }}
    >
      <View className="flex-row items-center justify-center">
        <Feather name={countdown.urgent ? 'alert-circle' : 'clock'} size={16} color={cor} />
        <CustomText
          size="subtitle"
          boldness="bolder"
          color="secondary"
          classes="ml-2"
          style={{ color: cor, fontVariant: ['tabular-nums'] }}
        >
          {countdown.label}
        </CustomText>
      </View>

      <CustomText size="small" color="muted" boldness="medium" classes="text-center mt-1">
        {t('matching.invitation.window')}
      </CustomText>

      {/* A proporção diz num relance o que o número sozinho não diz: "40s" é
          muito ou pouco conforme a janela seja de dois minutos ou de trinta. */}
      {countdown.remainingRatio !== null && (
        <View
          className="w-full rounded-full overflow-hidden mt-2"
          style={{ height: 4, backgroundColor: Colors.line }}
        >
          <View
            style={{
              width: `${Math.round(countdown.remainingRatio * 100)}%`,
              height: '100%',
              backgroundColor: cor,
            }}
          />
        </View>
      )}
    </View>
  );
};

export default MatchingInvitationDeadlineBar;
