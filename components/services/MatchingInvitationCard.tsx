import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { renderMoney } from '@/utils/money';
import { MatchingInvitation } from '@/types/matching';
import useExpiryCountdown from '@/hooks/useExpiryCountdown';

/**
 * Um convite de seleção — NÃO é um pedido adjudicado.
 *
 * Esta é a diferença que o cartão existe para comunicar. Num pedido de hoje,
 * aceitar é ficar com o serviço. Aqui, aceitar é candidatar-se: o cliente
 * escolhe depois, de entre quem aceitou. Se a interface não disser isto de
 * forma óbvia, o técnico assume o que já conhece e sente-se enganado na
 * primeira vez que perde — e um técnico que se sente enganado deixa de
 * responder.
 *
 * A ordem da informação segue a ordem das perguntas dele: QUANDO é, QUANTO
 * recebe, ONDE é, e só depois o que está em jogo. Antes o "quando" nem
 * aparecia; era a pergunta mais importante e a única sem resposta.
 */
const MatchingInvitationCard = ({
  invitation,
  onAccept,
  onDecline,
  busy,
}: {
  invitation: MatchingInvitation;
  onAccept: () => void;
  onDecline: () => void;
  busy?: boolean;
}) => {
  const { t } = useTranslation();
  const { label: countdown, remainingRatio, expired, urgent } = useExpiryCountdown(
    invitation.expires_at,
    invitation.notified_at,
  );

  const earn = renderMoney(invitation.amount_for_vendor ?? null);

  /** Quando é o serviço. É a primeira pergunta dele, por isso é a primeira linha. */
  const when = useMemo(() => {
    const raw = invitation.schedule?.scheduled_time_start ?? invitation.schedule?.scheduled_day;
    if (!raw) return null;

    const d = new Date(String(raw).replace(' ', 'T'));
    if (isNaN(d.getTime())) return null;

    const hasTime = !!invitation.schedule?.scheduled_time_start;
    const day = d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' });

    return hasTime
      ? `${day} · ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
      : day;
  }, [invitation.schedule]);

  const durationMinutes = invitation.service_type?.time ?? null;

  if (expired) return null;

  return (
    <View
      className="rounded-2xl border p-5 mb-3"
      style={{ borderColor: Colors.line, backgroundColor: Colors.card }}
    >
      {/* Contador e barra, tal como na Home: a mesma informação com a mesma
          cara nos dois sítios. Ver dois tratamentos diferentes para o mesmo
          número faz duvidar de ambos. */}
      {!!countdown && (
        <View className="mb-4">
          <View className="flex-row items-baseline mb-2">
            <CustomText
              size="medium"
              boldness="bolder"
              color="secondary"
              style={{ color: urgent ? Colors.brand : Colors.secondary, fontVariant: ['tabular-nums'] }}
            >
              {countdown}
            </CustomText>
            <CustomText size="extraSmall" color="secondary" classes="ml-1.5" style={{ color: Colors.muted }}>
              {t('matching.invitation.window')}
            </CustomText>
          </View>

          {remainingRatio !== null && (
            <View className="rounded-full overflow-hidden" style={{ height: 3, backgroundColor: Colors.card_high }}>
              <View
                style={{
                  height: 3,
                  width: `${Math.max(2, remainingRatio * 100)}%`,
                  backgroundColor: urgent ? Colors.brand : Colors.muted,
                }}
              />
            </View>
          )}
        </View>
      )}

      <CustomText size="medium" boldness="bolder" color="secondary">
        {invitation.service_type?.name ?? t('matching.invitation.fallback_title')}
      </CustomText>
      <View className="flex-row items-center mt-1.5 mb-5">
        <Feather name="map-pin" size={12} color={Colors.muted} />
        <CustomText size="small" color="secondary" classes="ml-1.5" style={{ color: Colors.muted }}>
          {invitation.address?.city ?? '—'}
          {invitation.distance ? ` · ${invitation.distance.toFixed(1)} km` : ''}
        </CustomText>
      </View>

      {/* QUANDO — a pergunta que decide se ele pode sequer aceitar. Antes não
          aparecia de todo: o payload trazia schedule a null porque a linha de
          agenda ainda não existe durante a seleção. */}
      {/* Quando, quanto tempo, e quanto dinheiro — três linhas com etiqueta,
          separadas por filetes. A duração estava encostada à direita da data em
          cinzento apagado e passava despercebida; sendo o que decide se o
          serviço cabe no dia dele, merece uma linha própria. */}
      <View className="border-t" style={{ borderColor: Colors.line }}>
        <View className="flex-row items-center justify-between py-3.5">
          <View className="flex-row items-center flex-1 pr-3">
            <Feather name={when ? 'calendar' : 'zap'} size={14} color={Colors.muted} />
            <CustomText size="small" boldness="bold" color="secondary" classes="ml-2">
              {when ?? t('matching.invitation.immediate')}
            </CustomText>
          </View>
        </View>

        {!!durationMinutes && (
          <View
            className="flex-row items-center justify-between py-3.5 border-t"
            style={{ borderColor: Colors.line }}
          >
            <View className="flex-row items-center">
              <Feather name="clock" size={14} color={Colors.muted} />
              <CustomText size="small" color="secondary" classes="ml-2" style={{ color: Colors.muted }}>
                {t('matching.invitation.duration_label')}
              </CustomText>
            </View>
            <CustomText size="small" boldness="bold" color="secondary">
              {t('matching.invitation.duration', { minutes: durationMinutes })}
            </CustomText>
          </View>
        )}

        <View
          className="flex-row items-center justify-between py-3.5 border-t"
          style={{ borderColor: Colors.line }}
        >
          <CustomText size="small" color="secondary" style={{ color: Colors.muted }}>
            {t('matching.invitation.you_receive')}
          </CustomText>
          <CustomText size="large" boldness="bolder" color="secondary" style={{ color: Colors.brand }}>
            {earn}
          </CustomText>
        </View>
      </View>

      <View className="mt-5" />

      <View className="flex-row">
        <TouchableOpacity
          onPress={onDecline}
          disabled={busy}
          className="flex-1 rounded-2xl py-3.5 items-center mr-2.5 border"
          style={{ borderColor: Colors.line, opacity: busy ? 0.5 : 1 }}
        >
          <CustomText boldness="bold" color="secondary" style={{ color: Colors.muted }}>
            {t('matching.invitation.decline')}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAccept}
          disabled={busy}
          className="flex-[1.4] rounded-2xl py-3.5 items-center"
          style={{ backgroundColor: Colors.brand, opacity: busy ? 0.5 : 1 }}
        >
          <CustomText boldness="bolder" color="secondary" style={{ color: Colors.on_brand }}>
            {t('matching.invitation.accept')}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MatchingInvitationCard;
