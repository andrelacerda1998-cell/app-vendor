import {View} from "react-native";
import {CustomText} from "@/components/CustomText";
import {Colors} from "@/constants/Colors";
import React from "react";
import {ServiceRequestedInterface} from "@/types/services";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import { Card, IconTile } from "@/components/ui";
import { formatDistanceKm, isImmediateRequest } from "@/utils/requestTiming";
import {
  formatAddressExtra,
  formatCustomerNotes,
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
  const stateColor = hasScheduleInfo ? Colors.brand : Colors.success;

  const distanceLabel = formatDistanceKm(item.distance);
  const countdownColor = urgent ? Colors.danger : Colors.success;

  // Morada completa (rua, número, código postal, cidade). Se o backend ainda
  // não devolver `address_details`, cai para a morada curta que já existia.
  const addressLabel = formatFullAddress(item.address_details, item.customer?.address);
  const addressExtra = formatAddressExtra(item.address_details);
  const durationLabel = formatEstimatedDuration(item.service_type?.time);
  const customerNotes = formatCustomerNotes(item);

  return (
  <Card>
    {/* Linha principal: ícone · serviço + morada · estado */}
    <View className="flex-row items-center">
      <IconTile size={52}>
        <Feather name={hasScheduleInfo ? 'calendar' : 'zap'} size={22} color={Colors.brand} />
      </IconTile>

      <View className="flex-1 ml-3">
        <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={1}>
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
        {(!!distanceLabel || !!durationLabel) && (
          <View className="flex-row items-center mt-0.5" style={{ gap: 10 }}>
            {!!distanceLabel && (
              <View className="flex-row items-center">
                <Feather name="map-pin" size={12} color={Colors.muted} />
                <CustomText color="muted" size="extraSmall" classes="ml-1" numberOfLines={1}>
                  {distanceLabel}
                </CustomText>
              </View>
            )}
            {/* Duração estimada (service_type.time, em minutos). */}
            {!!durationLabel && (
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

      <View
        className="rounded-full px-2.5 py-1 ml-2"
        style={{ backgroundColor: `${stateColor}22` }}
      >
        <CustomText size="extraSmall" boldness="bold" color="secondary">
          {stateLabel}
        </CustomText>
      </View>
    </View>

    {/* As duas peças que decidem: QUANDO e QUANTO RECEBO. */}
    <View className="flex-row mt-3" style={{ gap: 10 }}>
      <View
        className="flex-1 rounded-2xl p-3 border"
        style={{ backgroundColor: Colors.card_high, borderColor: Colors.line }}
      >
        <CustomText color="muted" size="extraSmall" boldness="bold">
          {t('schedules.when', { defaultValue: 'Quando' }).toUpperCase()}
        </CustomText>
        <CustomText color="secondary" boldness="bold" size="large" numberOfLines={2} classes="mt-1">
          {whenValue}
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
