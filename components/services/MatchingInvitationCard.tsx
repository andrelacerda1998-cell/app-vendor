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
  const { label: countdown, expired, urgent } = useExpiryCountdown(invitation.expires_at);

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
      {/* O contador vive numa pílula própria e discreta: é contexto, não é a
          oferta. Só ganha a cor da marca no último minuto, quando passa a ser
          uma decisão a tomar já. */}
      {!!countdown && (
        <View className="flex-row items-center mb-4">
          <View
            className="flex-row items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: urgent ? Colors.brand_soft : Colors.card_high }}
          >
            <Feather name="clock" size={11} color={urgent ? Colors.brand : Colors.muted} />
            <CustomText
              size="extraSmall"
              boldness="bold"
              color="secondary"
              classes="ml-1.5"
              style={{ color: urgent ? Colors.brand : Colors.muted, fontVariant: ['tabular-nums'] }}
            >
              {countdown} {t('matching.invitation.window')}
            </CustomText>
          </View>
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
      {/* Quando e quanto, um por cima do outro e separados por uma linha fina:
          são as duas respostas que ele procura, e caixas dentro de caixas só
          lhes tiravam peso. */}
      <View className="border-t" style={{ borderColor: Colors.line }}>
        {(when || durationMinutes) && (
          <View className="flex-row items-center justify-between py-3.5">
            <View className="flex-row items-center flex-1 pr-3">
              <Feather name={when ? 'calendar' : 'zap'} size={14} color={Colors.muted} />
              <CustomText size="small" boldness="bold" color="secondary" classes="ml-2">
                {when ?? t('matching.invitation.immediate')}
              </CustomText>
            </View>
            {!!durationMinutes && (
              <CustomText size="extraSmall" color="secondary" style={{ color: Colors.muted }}>
                {t('matching.invitation.duration', { minutes: durationMinutes })}
              </CustomText>
            )}
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

      {/* O aviso que impede o mal-entendido. Discreto de propósito: tem de ser
          lido, mas não pode pesar mais do que a proposta em si — antes ocupava
          três linhas realçadas e dominava o cartão. */}
      <CustomText
        size="extraSmall"
        color="secondary"
        classes="mt-4 mb-5"
        style={{ color: Colors.muted, lineHeight: 17 }}
      >
        {t('matching.invitation.explainer')}
      </CustomText>

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
