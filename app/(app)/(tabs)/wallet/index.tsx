/**
 * AGENDA — fita de semana + serviços agendados agrupados por dia.
 * (A rota chama-se "wallet" por legado; o separador é a Agenda.)
 */
import React, { useMemo, useState } from 'react';
import { tabBarContentPadding } from '@/constants/Layout';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useSession } from '@/contexts/SessionContext';
import { renderMoney } from '@/utils/money';
import { Card, EmptyState, ErrorState, SkeletonList, StatusPill } from '@/components/ui';
import { useIsOnline } from '@/hooks/useIsOnline';
import { formatStreetLine } from '@/utils/serviceDetails';
import { formatDistanceKm } from '@/utils/requestTiming';
import { ServiceStatus } from '@/types/services';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const parseDay = (value?: string) => {
  if (!value) return null;
  const iso = String(value).split('T')[0];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const hhmm = (t?: string) => (t ? String(t).slice(0, 5) : '');

const Agenda = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    scheduledServicesData,
    getScheduledServices,
    scheduledServicesLoading,
    scheduledServicesFailed,
  } = useSchedule();
  const { vendorData } = useSession();
  const isOnline = useIsOnline();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const onRefresh = async () => {
    if (!vendorData) return;
    setRefreshing(true);
    try { await getScheduledServices(vendorData); } finally { setRefreshing(false); }
  };

  const retry = () => {
    if (!vendorData) return;
    getScheduledServices(vendorData);
  };

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Próximos 7 dias para a fita de semana
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * DAY_MS)),
    [today]
  );

  // Agrupa por dia (janela de 7 dias)
  const groups = useMemo(() => {
    const limit = new Date(today.getTime() + 7 * DAY_MS);
    const map: Record<string, any[]> = {};
    (scheduledServicesData ?? []).forEach((s: any) => {
      const day = parseDay(s?.schedule?.scheduled_day);
      if (!day || day < today || day >= limit) return;
      (map[keyOf(day)] = map[keyOf(day)] || []).push(s);
    });
    Object.values(map).forEach((items) =>
      items.sort((a, b) =>
        hhmm(a?.schedule?.scheduled_time?.start).localeCompare(hhmm(b?.schedule?.scheduled_time?.start))
      )
    );
    return map;
  }, [scheduledServicesData, today]);

  const dayTotal = (items: any[]) =>
    items.reduce((s: number, i: any) => s + (Number(i?.amount_for_vendor) || 0), 0);

  /**
   * EM ATRASO: agendamentos cuja hora já passou e que não foram concluídos.
   *
   * Antes desapareciam simplesmente — a Agenda só olha para os próximos 7
   * dias. Um técnico que faltasse, ou se esquecesse de concluir, não tinha
   * como saber: nem "em atraso", nem "não compareceste". Ficava a acumular
   * faltas em silêncio, com a reputação a degradar-se sem aviso.
   */
  const overdue = useMemo(() => {
    const now = Date.now();
    return (scheduledServicesData ?? [])
      .filter((s: any) => {
        if (s?.status === ServiceStatus.FINISHED || s?.status === ServiceStatus.CLOSED) return false;
        const day = parseDay(s?.schedule?.scheduled_day);
        if (!day) return false;
        const [hh, mm] = hhmm(s?.schedule?.scheduled_time?.start).split(':').map(Number);
        const start = new Date(day);
        start.setHours(Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 0, 0);
        return start.getTime() < now;
      })
      .sort((a: any, b: any) =>
        String(b?.schedule?.scheduled_day).localeCompare(String(a?.schedule?.scheduled_day))
      );
  }, [scheduledServicesData]);

  const visibleKeys = (selectedDay ? [selectedDay] : Object.keys(groups)).sort();

  const dayTitle = (date: Date) => {
    const diff = Math.round((date.getTime() - today.getTime()) / DAY_MS);
    const label = date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    if (diff === 0) return `${t('schedules.date_label.today')}, ${label}`;
    if (diff === 1) return `${t('schedules.date_label.tomorrow')}, ${label}`;
    return date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  /**
   * `accent` pinta sempre a barra lateral do cartão; `label` só existe quando
   * há mesmo novidade — o estado "agendado" já é o que a Agenda inteira mostra.
   */
  const statusUi = (item: any): { label: string | null; accent: string } => {
    if (item?.on_the_way_at)
      return { label: t('services.service.status.steps.on_the_way'), accent: Colors.destination };
    if (item?.status === 'Arrived')
      return { label: t('services.service.status.steps.in_progress'), accent: Colors.destination };
    return { label: null, accent: Colors.brand };
  };

  return (
    <SafeAreaView className={`flex-1 bg-bg`}>
      <View className="px-5 pt-4 pb-3">
        <CustomText size="subtitle" color="secondary" boldness="bolder">
          {t('tabs.agenda')}
        </CustomText>
      </View>

      {/* Fita de semana */}
      <View className="px-5 pb-4">
        <View className="flex-row" style={{ gap: 8 }}>
          {weekDays.map((d) => {
            const k = keyOf(d);
            const hasItems = (groups[k]?.length ?? 0) > 0;
            const isSelected = selectedDay === k;
            return (
              <TouchableOpacity
                key={k}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={d.toLocaleDateString('pt-PT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                onPress={() => setSelectedDay(isSelected ? null : k)}
                className="flex-1 items-center rounded-2xl border py-2.5"
                style={{
                  borderColor: isSelected ? Colors.brand : Colors.line,
                  backgroundColor: isSelected ? 'rgba(250,187,91,0.12)' : Colors.card,
                }}
              >
                <CustomText size="extraSmall" color="muted">
                  {WEEKDAY_LETTERS[d.getDay()]}
                </CustomText>
                <CustomText size="medium" color="secondary" boldness="bolder" classes="mt-0.5">
                  {d.getDate()}
                </CustomText>
                <View
                  className="rounded-full mt-1"
                  style={{
                    width: 5, height: 5,
                    backgroundColor: hasItems ? Colors.brand : 'transparent',
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: tabBarContentPadding(insets.bottom) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        {/* EM ATRASO primeiro: é o que exige ação e o que ninguém lhe mostrava. */}
        {overdue.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="alert-triangle" size={16} color={Colors.warning} />
              <CustomText size="medium" color="secondary" boldness="bold" classes="ml-2">
                {t('agenda.overdue_title')}
              </CustomText>
            </View>
            <View style={{ gap: 10 }}>
              {overdue.map((item: any, i: number) => (
                <TouchableOpacity
                  key={`overdue-${item?.service_id ?? i}`}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  onPress={() => router.push(`/(app)/(services)/(open)/status/${item?.service_id}`)}
                >
                  <Card
                    className="flex-row items-center"
                    style={{ borderColor: Colors.warning }}
                  >
                    <View className="items-center" style={{ width: 52 }}>
                      <CustomText color="secondary" boldness="bolder" size="medium">
                        {hhmm(item?.schedule?.scheduled_time?.start) || '--:--'}
                      </CustomText>
                      <CustomText color="muted" size="extraSmall" classes="mt-0.5">
                        {(() => {
                          const d = parseDay(item?.schedule?.scheduled_day);
                          return d ? d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) : '';
                        })()}
                      </CustomText>
                    </View>
                    <View
                      className="self-stretch mx-3"
                      style={{ width: 2, borderRadius: 1, backgroundColor: Colors.warning }}
                    />
                    <View className="flex-1">
                      <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
                        {item?.service_type?.name ?? '—'}
                      </CustomText>
                      <CustomText color="muted" size="small" classes="mt-0.5" numberOfLines={2}>
                        {t('agenda.overdue_hint')}
                      </CustomText>
                    </View>
                    <Feather name="chevron-right" size={18} color={Colors.muted} />
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Ordem importa: a carregar e o erro vêm ANTES do vazio, senão uma
            falha de rede lê-se como "não tens nada marcado". */}
        {scheduledServicesLoading && (scheduledServicesData?.length ?? 0) === 0 ? (
          <SkeletonList rows={3} />
        ) : scheduledServicesFailed && (scheduledServicesData?.length ?? 0) === 0 ? (
          <ErrorState
            icon={isOnline ? 'alert-circle' : 'wifi-off'}
            title={t('agenda.error_title')}
            subtitle={isOnline ? t('agenda.error_subtitle') : t('general.offline_subtitle')}
            onRetry={retry}
          />
        ) : visibleKeys.filter((k) => groups[k]?.length).length === 0 ? (
          <EmptyState
            icon="calendar"
            title={selectedDay ? t('agenda.free_day_title') : t('agenda.empty_title')}
            subtitle={selectedDay ? t('agenda.free_day') : t('agenda.empty')}
          />
        ) : (
          visibleKeys.map((k) => {
            const items = groups[k];
            if (!items?.length) return null;
            const date = parseDay(k)!;
            return (
              <View key={k} className="mb-6">
                {/* Cabeçalho do dia + total */}
                <View className="flex-row items-center justify-between mb-3">
                  <CustomText size="medium" color="secondary" boldness="bold">
                    {dayTitle(date)}
                  </CustomText>
                  <CustomText size="medium" color="brand" boldness="bolder">
                    {renderMoney(dayTotal(items)) || '0,00 €'}
                  </CustomText>
                </View>

                <View style={{ gap: 10 }}>
                  {items.map((item: any, i: number) => {
                    const start = hhmm(item?.schedule?.scheduled_time?.start);
                    const price = renderMoney(item?.amount_for_vendor ?? null);
                    const ui = statusUi(item);
                    const serviceName = item?.service_type?.name ?? '—';
                    // A RUA, não a cidade: `customer.address` é "Cidade, Estado"
                    // e o técnico já sabe em que cidade trabalha.
                    const street = formatStreetLine(item?.address_details, item?.customer?.address);
                    // "a 9 km" ao lado da rua: é o que diz ao técnico se
                    // consegue encadear este serviço com o anterior.
                    const distanceLabel = formatDistanceKm(item?.distance);

                    return (
                      <TouchableOpacity
                        key={`${k}-${i}`}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={[
                          start,
                          serviceName,
                          street,
                          price,
                        ].filter(Boolean).join(', ')}
                        accessibilityHint={t('agenda.open_service_hint')}
                        // O estado do serviço (o que está incluído, morada, chat
                        // com o cliente) é o que o técnico precisa ao abrir um
                        // agendamento — daí abrir aqui e não um detalhe passivo.
                        onPress={() =>
                          router.push(`/(app)/(services)/(open)/status/${item?.service_id}`)
                        }
                      >
                        {/* Toque na linha inteira, não só na seta. */}
                        <Card className="flex-row items-center">
                          {/* Hora primeiro: numa agenda é por ela que se lê o dia. */}
                          <View className="items-center" style={{ width: 52 }}>
                            <CustomText color="secondary" boldness="bolder" size="medium">
                              {start || '--:--'}
                            </CustomText>
                          </View>

                          <View
                            className="self-stretch mx-3"
                            style={{ width: 2, borderRadius: 1, backgroundColor: ui.accent }}
                          />

                          <View className="flex-1">
                            {/* Duas linhas: a uma, "Reparar uma torneira a…"
                                cortava o que interessa. */}
                            <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
                              {serviceName}
                            </CustomText>
                            {(street || distanceLabel) ? (
                              <View className="flex-row items-center mt-0.5">
                                <Feather name="map-pin" size={12} color={Colors.muted} />
                                {/* Duas linhas: com a rua E a distância, uma só
                                    cortava a morada a meio ("Alameda dos Oce…"). */}
                                <CustomText color="muted" size="small" numberOfLines={2} classes="ml-1.5 flex-1">
                                  {[street, distanceLabel].filter(Boolean).join(' · ')}
                                </CustomText>
                              </View>
                            ) : null}
                            {/* A etiqueta só aparece quando diz algo novo: num ecrã
                                chamado Agenda, "Agendado" em todos os cartões é ruído. */}
                            {ui.label ? (
                              <StatusPill classes="mt-1.5" color={ui.accent} label={ui.label} />
                            ) : null}
                          </View>

                          <View className="flex-row items-center ml-2">
                            {price ? (
                              <CustomText color="secondary" boldness="bolder" size="medium">{price}</CustomText>
                            ) : null}
                            <Feather name="chevron-right" size={18} color={Colors.muted} style={{ marginLeft: 6 }} />
                          </View>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Agenda;
