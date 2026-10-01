import {View} from "react-native";
import {CustomText} from "@/components/CustomText";
import {Colors} from "@/constants/Colors";
import React from "react";
import {ServiceRequestedInterface} from "@/types/services";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import { Card } from "@/components/ui";
import CustomerPhotos from "@/components/app/CustomerPhotos";
import { formatDistanceKm, isImmediateRequest } from "@/utils/requestTiming";
import {
  formatAddressExtra,
  formatCustomerNotes,
  formatDurationLong,
  formatEstimatedDuration,
  formatFullAddress,
} from "@/utils/serviceDetails";

/**
 * Cartão de PEDIDO recebido (linguagem build-12).
 * Só usa campos que o backend devolve em ServiceRequestedInterface:
 * service_type.{name,time}, address_details, customer_notes, customer.address,
 * schedule.*, amount_for_vendor, distance.
 *
 * A decisão do profissional é "quando" + "quanto", por isso essas duas peças
 * ficam em caixas grandes lado a lado. Mas para decidir bem também precisa de
 * saber ONDE é (morada completa, não só "cidade, Estado"), QUANTO TEMPO demora
 * e O QUE o cliente pediu — por isso esses três dados também estão aqui.
 *
 * Campo ausente no payload => elemento omitido. Nunca inventamos valores.
 */
const ServiceCard = ({
  item,
  scheduleFor,
  price,
  remainingTime,
  progress,
  urgent = false,
  children,
}: {
  item: ServiceRequestedInterface;
  scheduleFor: string|null,
  price?: string | null;
  remainingTime?: { minutes: number; seconds: number } | null;
  /** Fração de tempo restante (1 → 0) para a barra fina. */
  progress?: number;
  /** Últimos segundos: pinta a contagem/barra de vermelho. */
  urgent?: boolean;
  children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const hasScheduleInfo = Boolean(
    item.schedule_id ||
    item.schedule?.scheduled_day ||
    item.schedule?.scheduled_time?.start ||
    item.schedule?.scheduled_time?.end
  );
  const immediate = isImmediateRequest(item);

  const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const formatScheduleDate = () => {
    if (!hasScheduleInfo) return t('schedules.immediate', { defaultValue: 'Imediato' });
    if (!item.schedule) return scheduleFor;
    const day = item.schedule.scheduled_day;
    const startTime = item.schedule.scheduled_time?.start?.slice(0, 5);
    if (!day) return scheduleFor || t('schedules.immediate', { defaultValue: 'Imediato' });

    let date: Date | null = null;
    if (/^\d{4}-\d{2}-\d{2}/.test(day)) {
      const [y, m, d] = day.split(/[-T]/);
      date = new Date(Number(y), Number(m) - 1, Number(d));
    } else if (/^\d{2}\/\d{2}\/\d{4}/.test(day)) {
      const [d, m, y] = day.split('/');
      date = new Date(Number(y), Number(m) - 1, Number(d));
    }

    if (!date || isNaN(date.getTime())) return scheduleFor;

    const formatted = `${date.getDate()} ${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`;
    return startTime ? `${formatted} · ${startTime}` : formatted;
  };

  // "Quando": agendados mostram data/hora, imediatos mostram "Agora".
  const whenValue = immediate
    ? t('schedules.now', { defaultValue: 'Agora' })
    : (formatScheduleDate() || '—');

  // Pill de estado: agendado vs imediato (derivado dos campos que já existem).
  const stateLabel = hasScheduleInfo
    ? t('schedules.schedule', { defaultValue: 'Agendamento' })
    : t('schedules.immediate', { defaultValue: 'Imediato' });
  /**
   * Imediato = VERMELHO; agendado = âmbar.
   *
   * O imediato estava a verde, que na app significa "está tudo bem" (é a cor do
   * "a receber pedidos" e do contador com tempo de sobra). Mas um pedido
   * imediato é o contrário disso: é a coisa com menos tempo no ecrã inteiro.
   * O agendado fica em âmbar porque é mesmo o que é -- tem tempo, mas é uma
   * tarefa por responder.
   */
  const stateColor = hasScheduleInfo ? Colors.brand : Colors.danger;

  const distanceLabel = formatDistanceKm(item.distance);
  const countdownColor = urgent ? Colors.danger : Colors.success;

  // Morada completa (rua, número, código postal, cidade). Se o backend ainda
  // não devolver `address_details`, cai para a morada curta que já existia.
  const addressLabel = formatFullAddress(item.address_details, item.customer?.address);
  const addressExtra = formatAddressExtra(item.address_details);
  /**
   * `duration_minutes` traz a duração REAL, já multiplicada pelas unidades que
   * o cliente pediu; `service_type.time` é o tempo de UMA unidade. Mostrar o
   * segundo dizia "1 hora" num trabalho de três -- o mesmo erro que já tinha
   * sido corrigido no ecrã do serviço a decorrer. Fica como recurso para
   * respostas antigas.
   */
  const duracaoReal = item.duration_minutes ?? item.service_type?.time;
  const durationLabel = formatEstimatedDuration(duracaoReal);
  const duracaoPorExtenso = formatDurationLong(duracaoReal);
  const customerNotes = formatCustomerNotes(item);

  return (
  <Card>
    {/* Linha principal: serviço + morada · estado.
        SEM ÍCONE à esquerda: o raio e o calendário eram 52 px (mais 12 de
        margem) a dizer o MESMO que o selo à direita diz por palavras, e era o
        título -- o que diz ao técnico o que vai fazer -- que pagava a conta,
        partido a meio em duas linhas. */}
    <View className="flex-row items-center">
      <View className="flex-1">
        {/* Sem o icone a roubar 64 px, o nome cabe numa linha na maioria dos
            casos. Ficam 2 para os tipos de servico mais compridos -- cortar a
            meio da palavra era o problema, nao a segunda linha. */}
        <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
          {item.service_type?.name}
        </CustomText>
        {/* Morada: o dado mais importante para decidir — 2 linhas, não 1. */}
        {!!addressLabel && (
          <CustomText color="muted" size="extraSmall" numberOfLines={2} classes="mt-0.5">
            {addressLabel}
          </CustomText>
        )}
        {!!addressExtra && (
          <CustomText color="muted" size="extraSmall" numberOfLines={1} classes="mt-0.5">
            {addressExtra}
          </CustomText>
        )}
        {(!!distanceLabel || (!!durationLabel && hasScheduleInfo)) && (
          <View className="flex-row items-center mt-0.5" style={{ gap: 10 }}>
            {!!distanceLabel && (
              <View className="flex-row items-center">
                <Feather name="map-pin" size={12} color={Colors.muted} />
                <CustomText color="muted" size="extraSmall" classes="ml-1" numberOfLines={1}>
                  {distanceLabel}
                </CustomText>
              </View>
            )}
            {/* Duração estimada. Só aqui nos AGENDADOS: nos imediatos ela tem
                caixa própria em baixo, no lugar que o "Quando" deixou vago. */}
            {!!durationLabel && hasScheduleInfo && (
              <View className="flex-row items-center">
                <Feather name="clock" size={12} color={Colors.muted} />
                <CustomText color="muted" size="extraSmall" classes="ml-1" numberOfLines={1}>
                  {durationLabel}
                </CustomText>
              </View>
            )}
          </View>
        )}
      </View>

      {/* A PALAVRA a vermelho, e nao so o fundo. Branco sobre um fundo
          avermelhado lia-se como um selo apagado -- a cor ficava no sitio onde
          ninguem olha. O contorno fecha a pastilha para ela nao desaparecer
          contra o cartao. */}
      <View
        className="rounded-full px-2.5 py-1 ml-2 border"
        style={{ backgroundColor: `${stateColor}1f`, borderColor: `${stateColor}66` }}
      >
        <CustomText size="extraSmall" boldness="bold" color={hasScheduleInfo ? 'brand' : 'danger'}>
          {stateLabel}
        </CustomText>
      </View>
    </View>

    {/* As duas peças que decidem. QUANTO RECEBO é sempre uma delas; a outra
        depende do tipo de pedido.

        Num AGENDADO a pergunta é "quando" -- a data é informação a sério.
        Num IMEDIATO não é: o selo verde já diz "Imediato" a dois centímetros
        dali, e a caixa respondia "Agora" ao lado dele. Duas peças a dizer o
        mesmo, e a que faltava -- quanto tempo é que isto me ocupa -- estava
        encolhida num "~1h" ao lado dos quilómetros, a ler-se como símbolo e
        não como informação. Trocam de lugar. */}
    <View className="flex-row mt-3" style={{ gap: 10 }}>
      <View
        className="flex-1 rounded-2xl p-3 border"
        style={{ backgroundColor: Colors.card_high, borderColor: Colors.line }}
      >
        <CustomText color="muted" size="extraSmall" boldness="bold">
          {(hasScheduleInfo
            ? t('schedules.when', { defaultValue: 'Quando' })
            : t('schedules.estimated_duration', { defaultValue: 'Duração estimada' })
          ).toUpperCase()}
        </CustomText>
        <CustomText color="secondary" boldness="bold" size="large" numberOfLines={2} classes="mt-1">
          {hasScheduleInfo ? whenValue : (duracaoPorExtenso || '—')}
        </CustomText>
      </View>

      <View
        className="flex-1 rounded-2xl p-3 border"
        style={{ backgroundColor: Colors.brand_soft, borderColor: `${Colors.brand}55` }}
      >
        <CustomText color="muted" size="extraSmall" boldness="bold">
          {t('schedules.you_receive', { defaultValue: 'Recebes' }).toUpperCase()}
        </CustomText>
        <CustomText color="brand" boldness="bolder" size="large" numberOfLines={1} classes="mt-1">
          {price || '—'}
        </CustomText>
      </View>
    </View>

    {/* Observações do cliente — só aparece quando existem mesmo. */}
    {!!customerNotes && (
      <View
        className="mt-3 rounded-2xl p-3 border flex-row"
        style={{ backgroundColor: Colors.card_high, borderColor: Colors.line }}
      >
        <Feather name="message-square" size={16} color={Colors.brand} style={{ marginTop: 2 }} />
        <View className="flex-1 ml-2">
          <CustomText color="muted" size="extraSmall" boldness="bold">
            {t('schedules.customer_notes', { defaultValue: 'Observações do cliente' }).toUpperCase()}
          </CustomText>
          <CustomText color="secondary" size="small" numberOfLines={3} classes="mt-1">
            {customerNotes}
          </CustomText>
        </View>
      </View>
    )}

    {/* As fotos vêm a seguir às observações: são a mesma resposta ("o que é
        isto?") em duas linguagens, e o profissional lê-as em conjunto antes
        de decidir se aceita. */}
    <CustomerPhotos photos={item.customer_photos} compact />

    {/* Contagem decrescente para aceitar + barra fina que esvazia */}
    {!!remainingTime && (
      <View className="mt-3">
        <View className="flex-row items-center">
          <Feather name="clock" size={14} color={countdownColor} />
          <CustomText
            color={urgent ? 'danger' : 'success'}
            size="small"
            boldness={urgent ? 'bold' : 'regular'}
            classes="ml-2"
          >
            {remainingTime.minutes}:{String(remainingTime.seconds).padStart(2, "0")} {t('schedules.to_accept', { defaultValue: 'para aceitar' })}
          </CustomText>
        </View>
        <View
          className="mt-2 rounded-full overflow-hidden"
          style={{ height: 4, backgroundColor: Colors.line }}
        >
          <View
            style={{
              height: 4,
              borderRadius: 999,
              backgroundColor: countdownColor,
              width: `${Math.max(0, Math.min(1, progress ?? 1)) * 100}%`,
            }}
          />
        </View>
      </View>
    )}

    {/* Separador + ações */}
    <View className="h-[1px] my-3" style={{ backgroundColor: Colors.line }} />
    { children }
  </Card>
  );
};

export default ServiceCard;
