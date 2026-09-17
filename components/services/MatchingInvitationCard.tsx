import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { renderMoney } from '@/utils/money';
import { MatchingInvitation } from '@/types/matching';
import useElapsedSince from '@/hooks/useElapsedSince';

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
  // `expired` continua a vir do prazo real: o convite deixa de valer quando a
  // janela fecha, mesmo que o ecra ja nao a mostre em contagem decrescente.
  const expired = !!invitation.expires_at && new Date(invitation.expires_at).getTime() <= Date.now();
  const elapsed = useElapsedSince(invitation.notified_at);

  const earn = renderMoney(invitation.amount_for_vendor ?? null);

  /** Quando é o serviço. É a primeira pergunta dele, por isso é a primeira linha. */
  const when = useMemo(() => {
    // scheduled_day é uma date (YYYY-MM-DD) e scheduled_time_start uma time
    // (HH:MM:SS). A data tem de vir do DIA — usar só a hora dava um Date
    // inválido ("10:00:00" não é uma data) e o agendado aparecia como "Para
    // agora". Combina-se dia + hora quando ambos existem.
    const day = invitation.schedule?.scheduled_day;
    const time = invitation.schedule?.scheduled_time_start;
    if (!day) return null;

    const d = new Date(`${day}T${time ?? '00:00:00'}`);
    if (isNaN(d.getTime())) return null;

    const label = d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' });

    return time
      ? `${label} · ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
      : label;
  }, [invitation.schedule]);

  // Num personalizado a duracao vem do backoffice, nao do tipo.
  const durationMinutes = invitation.duration_minutes ?? invitation.service_type?.time ?? null;

  if (expired) return null;

  return (
    <View
      className="rounded-2xl border p-5 mb-3"
      style={{ borderColor: Colors.line, backgroundColor: Colors.card }}
    >
      {/* HA QUANTO TEMPO o pedido foi feito — em destaque, e a correr.
          Nao e quanto FALTA: a contagem decrescente prometia que responder a
          tempo dava o trabalho, e nao da — quem escolhe e o cliente, e o
          convite fecha assim que tres responderem.
          O que conta para decidir e ha quanto tempo o pedido esta em cima da
          mesa: ha 2 minutos ainda vale a pena, ha 18 ja ha gente a frente. */}
      {!!elapsed && (
        <View className="items-center mb-5">
          <CustomText size="extraSmall" color="muted" boldness="bold" classes="mb-1">
            {t('matching.invitation.asked_label')}
          </CustomText>
          <CustomText
            size="headline"
            boldness="bolder"
            color="secondary"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {elapsed.label}
          </CustomText>
        </View>
      )}

      {/* Num personalizado o titulo E a descricao do cliente: e o unico sitio
          onde o profissional fica a saber o que e o trabalho. */}
      <CustomText
        size="medium"
        boldness="bolder"
        color="secondary"
        numberOfLines={invitation.custom ? 3 : undefined}
      >
        {invitation.custom?.description
          ?? invitation.service_type?.name
          ?? t('matching.invitation.fallback_title')}
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
      {/* Quando, quanto tempo, e quanto dinheiro.
          O destaque vem de PESO, COR e FORMA — nunca de aumentar as letras: o
          bloco ganha fundo próprio para se separar do resto do cartão, os
          valores ficam em branco cheio contra etiquetas apagadas, e cada linha
          tem o seu ícone com a cor da marca. */}
      <View className="rounded-xl overflow-hidden" style={{ backgroundColor: Colors.card_high }}>
        <View className="flex-row items-center justify-between px-3.5 py-3">
          <View className="flex-row items-center">
            <Feather name={when ? 'calendar' : 'zap'} size={14} color={Colors.brand} />
            <CustomText size="small" color="secondary" classes="ml-2.5" style={{ color: Colors.muted }}>
              {t('matching.invitation.when_label')}
            </CustomText>
          </View>
          {when ? (
            <CustomText size="small" boldness="bolder" color="secondary">
              {when}
            </CustomText>
          ) : (
            // Imediato ganha um badge cheio da cor da marca: "Agora" é a
            // informação que muda a decisão, por isso destaca-se pela FORMA e
            // COR, não pelo tamanho da letra.
            <View
              className="flex-row items-center rounded-full px-2.5 py-1"
              style={{ backgroundColor: Colors.support_primary }}
            >
              <Feather name="zap" size={12} color={Colors.on_brand} />
              <CustomText size="small" color="secondary" boldness="bolder" classes="ml-1" style={{ color: Colors.on_brand }}>
                {t('matching.invitation.immediate')}
              </CustomText>
            </View>
          )}
        </View>

        {!!durationMinutes && (
          <View
            className="flex-row items-center justify-between px-3.5 py-3 border-t"
            style={{ borderColor: Colors.line }}
          >
            <View className="flex-row items-center">
              <Feather name="clock" size={14} color={Colors.brand} />
              <CustomText size="small" color="secondary" classes="ml-2.5" style={{ color: Colors.muted }}>
                {t('matching.invitation.duration_label')}
              </CustomText>
            </View>
            <CustomText size="small" boldness="bolder" color="secondary">
              {t('matching.invitation.duration', { minutes: durationMinutes })}
            </CustomText>
          </View>
        )}

        {/* O dinheiro é o único com a cor da marca: é o que ele veio ver. */}
        <View
          className="flex-row items-center justify-between px-3.5 py-3 border-t"
          style={{ borderColor: Colors.line }}
        >
          <View className="flex-row items-center">
            <Feather name="credit-card" size={14} color={Colors.brand} />
            <CustomText size="small" color="secondary" classes="ml-2.5" style={{ color: Colors.muted }}>
              {t('matching.invitation.you_receive')}
            </CustomText>
          </View>
          <CustomText size="large" boldness="bolder" color="secondary" style={{ color: Colors.brand }}>
            {earn}
          </CustomText>
        </View>
      </View>

      <View className="mt-5" />

      <View className="flex-row">
        {/* Recusar tem fundo tonal e não contorno vazio: ao lado de um botão
            cheio, um contorno oco lê-se como desativado. Com um fundo próprio
            passa a ser claramente tocável, sem deixar de ser o secundário — é a
            COR e a LARGURA que mantêm a hierarquia, não a falta de forma.

            Vermelho suave e não saturado: recusar é uma escolha legítima, não
            um erro. */}
        <TouchableOpacity
          onPress={onDecline}
          disabled={busy}
          accessibilityRole="button"
          className="flex-1 flex-row rounded-2xl py-3.5 items-center justify-center mr-2.5"
          style={{ backgroundColor: `${Colors.danger}1A`, opacity: busy ? 0.5 : 1 }}
        >
          <CustomText boldness="bold" color="secondary" style={{ color: Colors.danger }}>
            {t('matching.invitation.decline')}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAccept}
          disabled={busy}
          accessibilityRole="button"
          className="flex-[1.4] flex-row rounded-2xl py-3.5 items-center justify-center"
          // Verde, e nao ambar: dizer que se esta disponivel e um "sim", da
          // mesma familia do visto de confirmado. O ambar da marca fica para o
          // dinheiro e para os avisos.
          style={{ backgroundColor: Colors.success, opacity: busy ? 0.5 : 1 }}
        >
          <CustomText boldness="bolder" color="secondary" style={{ color: Colors.strongest }}>
            {t('matching.invitation.accept')}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MatchingInvitationCard;
