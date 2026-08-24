import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { renderMoney } from '@/utils/money';
import { MatchingInvitation } from '@/types/matching';

const pad = (n: number) => String(n).padStart(2, '0');

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
  const [now, setNow] = useState(() => Date.now());

  const expiresAt = useMemo(() => {
    if (!invitation.expires_at) return 0;
    const parsed = new Date(invitation.expires_at).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }, [invitation.expires_at]);

  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const expired = expiresAt > 0 && remainingMs === 0;

  // Ao segundo apenas no último minuto: acima disso, o segundo a mexer é ruído
  // que gasta bateria sem ajudar a decidir.
  useEffect(() => {
    if (!expiresAt || expired) return;
    const fine = remainingMs < 60_000;
    const id = setInterval(() => setNow(Date.now()), fine ? 1000 : 20_000);
    return () => clearInterval(id);
  }, [expiresAt, expired, remainingMs]);

  /**
   * Tempo que falta para responder.
   *
   * "18:44" lia-se como uma HORA DO DIA — perigoso numa app cheia de horários
   * de serviços. Passa a "18 min", e só desce ao segundo no último minuto,
   * quando o segundo passa mesmo a importar.
   */
  const countdown = useMemo(() => {
    if (!expiresAt) return null;
    const total = Math.floor(remainingMs / 1000);
    if (total >= 3600) {
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      return t('matching.invitation.window_hours', { hours: h, minutes: pad(m) });
    }
    if (total >= 60) {
      return t('matching.invitation.window_minutes', { count: Math.ceil(total / 60) });
    }
    return t('matching.invitation.window_seconds', { count: total });
  }, [expiresAt, remainingMs, t]);

  const urgent = remainingMs > 0 && remainingMs <= 60_000;
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
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 pr-3">
          <CustomText size="medium" boldness="bold" color="secondary">
            {invitation.service_type?.name ?? t('matching.invitation.fallback_title')}
          </CustomText>
          <View className="flex-row items-center mt-1">
            <Feather name="map-pin" size={12} color={Colors.muted} />
            <CustomText size="small" color="secondary" classes="ml-1.5" style={{ color: Colors.muted }}>
              {invitation.address?.city ?? '—'}
              {invitation.distance ? ` · ${invitation.distance.toFixed(1)} km` : ''}
            </CustomText>
          </View>
        </View>

        {!!countdown && (
          <View className="items-end">
            <CustomText
              size="medium"
              boldness="bolder"
              color="secondary"
              style={{ color: urgent ? Colors.brand : Colors.secondary, fontVariant: ['tabular-nums'] }}
            >
              {countdown}
            </CustomText>
            <CustomText size="extraSmall" color="secondary" style={{ color: Colors.muted }}>
              {t('matching.invitation.window')}
            </CustomText>
          </View>
        )}
      </View>

      {/* QUANDO — a pergunta que decide se ele pode sequer aceitar. Antes não
          aparecia de todo: o payload trazia schedule a null porque a linha de
          agenda ainda não existe durante a seleção. */}
      {(when || durationMinutes) && (
        <View
          className="flex-row items-center rounded-xl px-3 py-2.5 mb-3"
          style={{ backgroundColor: Colors.card_high }}
        >
          <Feather name={when ? 'calendar' : 'clock'} size={14} color={Colors.secondary} />
          <CustomText size="small" boldness="bold" color="secondary" classes="ml-2 flex-1">
            {when ?? t('matching.invitation.immediate')}
          </CustomText>
          {!!durationMinutes && (
            <CustomText size="extraSmall" color="secondary" style={{ color: Colors.muted }}>
              {t('matching.invitation.duration', { minutes: durationMinutes })}
            </CustomText>
          )}
        </View>
      )}

      <View className="mb-4">
        <CustomText size="extraSmall" color="secondary" style={{ color: Colors.muted, letterSpacing: 1 }}>
          {t('matching.invitation.you_receive').toUpperCase()}
        </CustomText>
        <CustomText size="large" boldness="bolder" color="secondary" style={{ color: Colors.brand }}>
          {earn}
        </CustomText>
      </View>

      {/* O aviso que impede o mal-entendido. Discreto de propósito: tem de ser
          lido, mas não pode pesar mais do que a proposta em si — antes ocupava
          três linhas realçadas e dominava o cartão. */}
      <View className="flex-row mb-4">
        <Feather name="info" size={13} color={Colors.muted} style={{ marginTop: 2 }} />
        <CustomText size="extraSmall" color="secondary" classes="ml-2 flex-1" style={{ color: Colors.muted }}>
          {t('matching.invitation.explainer')}
        </CustomText>
      </View>

      <View className="flex-row">
        <TouchableOpacity
          onPress={onDecline}
          disabled={busy}
          className="flex-1 rounded-xl py-3 items-center mr-2 border"
          style={{ borderColor: Colors.line, opacity: busy ? 0.5 : 1 }}
        >
          <CustomText boldness="bold" color="secondary" style={{ color: Colors.muted }}>
            {t('matching.invitation.decline')}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAccept}
          disabled={busy}
          className="flex-[1.4] rounded-xl py-3 items-center"
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
