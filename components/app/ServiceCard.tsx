import {View} from "react-native";
import {CustomText} from "@/components/CustomText";
import CalendarIcon from "@/assets/icons/calendar";
import LocationIcon from "@/assets/icons/location";
import {Colors} from "@/constants/Colors";
import React from "react";
import {ServiceRequestedInterface} from "@/types/services";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";

const ServiceCard = ({
  item,
  scheduleFor,
  price,
  remainingTime,
  children,
}: {
  item: ServiceRequestedInterface;
  scheduleFor: string|null,
  price?: string | null;
  remainingTime?: { minutes: number; seconds: number } | null;
  children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const hasScheduleInfo = Boolean(
    item.schedule_id ||
    item.schedule?.scheduled_day ||
    item.schedule?.scheduled_time?.start ||
    item.schedule?.scheduled_time?.end
  );

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

  return (
  <View className="rounded-2xl border border-[#2C2C2C] bg-[#1F1F1F] px-4 py-4 space-y-3">
    {/* Header: Service name · Agendado ... Price */}
    <View>
      <View className="flex-row items-start justify-between">
        <CustomText color="secondary" boldness="semiBold" classes="text-xs" style={{ flexShrink: 1 }}>
          {item.service_type.name}
        </CustomText>
        {hasScheduleInfo && (
          <View className="items-end ml-2">
            <View className="flex-row items-center">
              <CustomText color="secondary" boldness="bold" classes="text-lg"> · </CustomText>
              <CustomText color="support_primary" boldness="medium" classes="text-sm" numberOfLines={1}>
                {t('schedules.schedule')}
              </CustomText>
            </View>
            {price && (
              <CustomText color="support_primary" boldness="semiBold" classes="text-sm">
                {price}
              </CustomText>
            )}
          </View>
        )}
        {!hasScheduleInfo && price && (
          <CustomText color="support_primary" boldness="semiBold" classes="text-sm ml-2">
            {price}
          </CustomText>
        )}
      </View>


    </View>
    {/* Remaining time: 🕐 15:40 para aceitar */}
    {remainingTime && (
        <View className="flex-row items-center space-x-2 mt-1">
          <Feather name="clock" size={14} color={Colors.success} />
          <CustomText color="success" size="small">
            {remainingTime.minutes}:{String(remainingTime.seconds).padStart(2, "0")} {t('schedules.to_accept', { defaultValue: 'para aceitar' })}
          </CustomText>
        </View>
    )}
    {/* Separator */}
    <View className="h-[1px] bg-[#3C3C3C]" />

    {/* Calendar + date: 10 Fev 2026 · 14:00 */}
    <View className="flex-row items-center space-x-3">
      <View className="h-5 w-5" style={{ marginTop: 1 }}>
        <CalendarIcon color={Colors.support_primary} />
      </View>
      <CustomText color="secondary" size="small">
        {formatScheduleDate() || '-'}
      </CustomText>
    </View>

    {/* Location + address */}
    <View className="flex-row items-center space-x-3">
      <View className="h-5 w-5" style={{ marginTop: 1 }}>
        <LocationIcon color={Colors.support_primary} />
      </View>
      <CustomText color="secondary" size="small" numberOfLines={2}>
        {item.customer.address}
      </CustomText>
    </View>

    {/* Buttons / children */}
    { children }
  </View>
  );
};

export default ServiceCard;
