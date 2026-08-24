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
 * Por isso o cartão é visualmente diferente dos pedidos normais (contorno em
 * vez de cheio, sem o verde de "aceite") e diz por palavras o que está em jogo.
 *
 * O contador é visível de propósito. Sem saber quando a janela fecha, ele fica
 * pendurado sem saber se pode assumir outro trabalho.
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

  const countdown = useMemo(() => {
    if (!expiresAt) return null;
    const total = Math.floor(remainingMs / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h${pad(m)}`;
    return `${m}:${pad(s)}`;
  }, [expiresAt, remainingMs]);

  const urgent = remainingMs > 0 && remainingMs <= 60_000;
  const earn = renderMoney(invitation.amount_for_vendor ?? null);
  const scheduled = !!invitation.schedule?.scheduled_day;

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
          {!!invitation.address?.city && (
            <CustomText size="small" color="secondary" classes="mt-0.5" style={{ color: Colors.muted }}>
              {invitation.address.city}
              {invitation.distance ? ` · ${invitation.distance.toFixed(1)} km` : ''}
            </CustomText>
          )}
        </View>

        {!!countdown && (
          <View className="items-end">
            <CustomText
              size="large"
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

      <View className="flex-row items-center justify-between mb-4">
        <View>
          <CustomText size="extraSmall" color="secondary" style={{ color: Colors.muted, letterSpacing: 1 }}>
            {t('matching.invitation.you_receive').toUpperCase()}
          </CustomText>
          <CustomText size="large" boldness="bolder" color="secondary" style={{ color: Colors.brand }}>
            {earn}
          </CustomText>
        </View>

        {scheduled && (
          <View className="flex-row items-center">
            <Feather name="calendar" size={14} color={Colors.muted} />
            <CustomText size="small" color="secondary" classes="ml-1.5" style={{ color: Colors.muted }}>
              {invitation.schedule?.scheduled_day}
            </CustomText>
          </View>
        )}
      </View>

      {/* O aviso que impede o mal-entendido. Não é letra pequena por acaso:
          tem de ser lido ANTES de ele tocar em "Estou disponível". */}
      <View
        className="rounded-xl px-3 py-2.5 mb-4 flex-row"
        style={{ backgroundColor: Colors.brand_soft }}
      >
        <Feather name="info" size={14} color={Colors.brand} style={{ marginTop: 2 }} />
        <CustomText size="extraSmall" color="secondary" classes="ml-2 flex-1">
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
