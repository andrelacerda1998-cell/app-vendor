/**
 * DETALHE DE UM SERVIÇO AGENDADO.
 *
 * Aberto a partir de um cartão da Agenda. Não há endpoint de detalhe por id:
 * o ecrã lê o item de `scheduledServicesData` (ScheduleContext), que é a mesma
 * fonte da lista da Agenda — por isso nunca faz fetch próprio. Num deep link
 * frio (item ainda não carregado) mostra um ErrorState com saída para a Agenda.
 */
import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useSchedule } from '@/contexts/ScheduleContext';
import { renderMoney } from '@/utils/money';
import { Card, HeroCard, IconTile, ErrorState } from '@/components/ui';

const hhmm = (t?: string) => (t ? String(t).slice(0, 5) : '');

const parseDay = (value?: string) => {
  if (!value) return null;
  const iso = String(value).split('T')[0];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const ScheduleDetail = () => {
  const { t } = useTranslation();
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  const { scheduledServicesData } = useSchedule();

  // O id do cartão é o `schedule_id` quando existe, senão o `service_id` —
  // a mesma regra usada pela Agenda ao navegar para aqui.
  const item = useMemo(
    () =>
      (scheduledServicesData ?? []).find(
        (s: any) =>
          String(s?.schedule_id ?? s?.service_id) === String(scheduleId) ||
          String(s?.service_id) === String(scheduleId)
      ),
    [scheduledServicesData, scheduleId]
  );

  const goToAgenda = () => router.replace('/(app)/(tabs)/wallet');

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <BackHeader
          backButtonColor="secondary"
          middleItem={() => (
            <CustomText color="secondary" boldness="bold" numberOfLines={1}>
              {t('schedules.service_scheduled')}
            </CustomText>
          )}
          otherClasses="px-5 py-4"
        />
        <View className="flex-1 px-5 pt-2">
          <ErrorState
            icon="calendar"
            title={t('agenda.error_title')}
            subtitle={t('agenda.error_subtitle')}
            onRetry={goToAgenda}
            retryLabel={t('tabs.agenda')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const svc: any = item;
  const day = parseDay(svc?.schedule?.scheduled_day);
  const start = hhmm(svc?.schedule?.scheduled_time?.start);
  const end = hhmm(svc?.schedule?.scheduled_time?.end);
  const earn = renderMoney(svc?.amount_for_vendor ?? svc?.amount ?? null);

  const statusUi = svc?.on_the_way_at
    ? { label: t('services.service.status.steps.on_the_way'), color: Colors.destination }
    : svc?.status === 'Arrived'
    ? { label: t('services.service.status.steps.in_progress'), color: Colors.destination }
    : { label: t('agenda.scheduled'), color: Colors.destination };

  const dayLabel = (() => {
    if (!day) return svc?.schedule?.date_label ?? null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((day.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    const label = day.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    if (diff === 0) return `${t('schedules.date_label.today')}, ${label}`;
    if (diff === 1) return `${t('schedules.date_label.tomorrow')}, ${label}`;
    return day.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' });
  })();

  const timeLabel = start ? (end ? `${start} – ${end}` : start) : null;
  const duration = svc?.service_type?.time;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('schedules.service_scheduled')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Cabeçalho: serviço + estado + quando */}
        <Card>
          <View className="flex-row items-center">
            <IconTile size={52}>
              <Feather name="tool" size={22} color={Colors.brand} />
            </IconTile>
            <View className="flex-1 ml-3">
              <CustomText color="secondary" boldness="bolder" size="medium" numberOfLines={2}>
                {svc?.service_type?.name ?? '—'}
              </CustomText>
            </View>
            <View className="rounded-full px-3 py-1.5 ml-2" style={{ backgroundColor: `${statusUi.color}22` }}>
              <CustomText size="extraSmall" boldness="bold" color="secondary" style={{ color: statusUi.color }}>
                {statusUi.label}
              </CustomText>
            </View>
          </View>

          <View className="h-px my-4" style={{ backgroundColor: Colors.line }} />

          {!!dayLabel && (
            <View className="flex-row items-center mb-2">
              <Feather name="calendar" size={15} color={Colors.muted} />
              <CustomText color="secondary" size="small" classes="ml-2.5">{dayLabel}</CustomText>
            </View>
          )}
          {!!timeLabel && (
            <View className="flex-row items-center mb-2">
              <Feather name="clock" size={15} color={Colors.muted} />
              <CustomText color="secondary" size="small" classes="ml-2.5">{timeLabel}</CustomText>
            </View>
          )}
          {!!duration && (
            <View className="flex-row items-center">
              <Feather name="watch" size={15} color={Colors.muted} />
              <CustomText color="secondary" size="small" classes="ml-2.5">
                {t('services.service.status.estimated_duration', { value: duration })}
              </CustomText>
            </View>
          )}
        </Card>

        {/* Cliente + morada */}
        <Card className="mt-3">
          <CustomText color="muted" size="extraSmall" boldness="bold">
            {t('schedules.customer')}
          </CustomText>
          <CustomText color="secondary" boldness="bolder" size="large" numberOfLines={1} classes="mt-0.5">
            {svc?.customer?.name ?? '—'}
          </CustomText>
          {!!svc?.customer?.address && (
            <View className="flex-row items-start mt-1">
              <Feather name="map-pin" size={14} color={Colors.muted} style={{ marginTop: 2 }} />
              <CustomText color="muted" size="small" numberOfLines={3} classes="ml-1.5 flex-1">
                {svc.customer.address}
              </CustomText>
            </View>
          )}
          {!!svc?.customer_notes && (
            <>
              <View className="h-px my-3" style={{ backgroundColor: Colors.line }} />
              <CustomText color="muted" size="extraSmall" boldness="bold">
                {t('schedules.customer_notes')}
              </CustomText>
              <CustomText color="secondary" size="small" classes="mt-1">
                {svc.customer_notes}
              </CustomText>
            </>
          )}
        </Card>

        {/* Valor a receber */}
        {earn ? (
          <HeroCard className="flex-row items-center justify-between" style={{ marginTop: 12 }}>
            <CustomText color="secondary" boldness="semiBold" size="medium">
              {t('services.service.status.value_to_receive')}
            </CustomText>
            <CustomText color="secondary" boldness="bolder" size="subtitle">
              {earn}
            </CustomText>
          </HeroCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScheduleDetail;
