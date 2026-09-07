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
import { formatStreetLine, recurrenceLabelKey } from '@/utils/serviceDetails';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import TouchOpacity from '@/components/TouchOpacity';
import CheckMark from '@/assets/icons/check-mark';
import { formatDistanceKm } from '@/utils/requestTiming';
import { ServiceStatus } from '@/types/services';
import useUnavailableDays from '@/hooks/useUnavailableDays';

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
  // Indisponibilidade pontual: toque longo num dia da fita marca/desmarca.
  const unavailable = useUnavailableDays();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  /**
   * Confirmações feitas nesta sessão.
   *
   * O `scheduledServicesData` vem do contexto e só muda quando a agenda é
   * recarregada; sem isto, o técnico carregava em "Confirmar presença" e o
   * botão ficava lá na mesma, como se nada tivesse acontecido.
   */
  const [confirmedNow, setConfirmedNow] = useState<Record<number, boolean>>({});

  /**
   * "Confirmo que vou."
   *
   * Aceitar o agendamento foi há dias ou semanas; isto é o técnico a dizer que
   * continua a contar com ele. É o que evita o cliente em casa à espera de
   * alguém que se esqueceu — e, quando a confirmação não chega, dá tempo à
   * operação de arranjar outro técnico.
   */
  const confirmAttendance = (item: any) => {
    const scheduleId = item?.schedule_id;
    if (!scheduleId) return;

    setConfirmingId(scheduleId);
    api.post(API_ROUTES.VENDOR_CONFIRM_SCHEDULE_ATTENDANCE(scheduleId))
      .then(() => {
        setConfirmedNow((prev) => ({ ...prev, [scheduleId]: true }));

        // A mensagem repete o QUANDO em vez de repetir "confirmada" (que já
        // fica escrito no cartão, logo por baixo): o que o técnico precisa de
        // levar deste ecrã é o dia e a hora a que ficou de aparecer.
        const day = parseDay(item?.schedule?.scheduled_day);
        const start = hhmm(item?.schedule?.scheduled_time?.start);
        const when = day && start ? `${dayTitle(day).toLowerCase()}, às ${start}` : null;

        openDialog({
          icon: <CheckMark color={Colors.primary} />,
          title: t('schedules.confirm_attendance_success_title'),
          subtitle: when
            ? t('schedules.confirm_attendance_success_subtitle', { when })
            : t('schedules.confirm_attendance_success_subtitle_generic'),
          closeAfterMSeconds: 2500,
          closeOnClickOutside: true,
        });
      })
      .catch((err) => {
        console.error(err);
        openDialog({
          title: t('services.cancel.error.title'),
          subtitle: t('schedules.confirm_attendance_error'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
      })
      .finally(() => setConfirmingId(null));
  };

  /**
   * Janela da confirmação: as mesmas 72h do lembrete que o servidor envia.
   * Antes disso é cedo demais para valer alguma coisa; depois da hora já não
   * há nada a confirmar.
   */
  const attendanceState = (item: any) => {
    const confirmed = !!item?.schedule?.vendor_confirmed_at || !!confirmedNow[item?.schedule_id];
    if (confirmed) return 'confirmed' as const;

    const day = parseDay(item?.schedule?.scheduled_day);
    const start = hhmm(item?.schedule?.scheduled_time?.start);
    if (!day || !/^\d{2}:\d{2}$/.test(start)) return 'hidden' as const;

    const [hh, mm] = start.split(':').map(Number);
    const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm).getTime();
    const hoursToStart = (startsAt - Date.now()) / 3_600_000;

    return hoursToStart > 0 && hoursToStart <= 72 ? ('pending' as const) : ('hidden' as const);
  };

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

  // Agrupa por dia (janela de 7 dias)
  const groups = useMemo(() => {
    const limit = new Date(today.getTime() + 7 * DAY_MS);
    const map: Record<string, any[]> = {};
    // Um serviço de HOJE cuja hora já passou entra em "Em atraso"; sem esta
    // exclusão aparecia também em "Hoje" — o mesmo cartão duas vezes no ecrã.
    const overdueIds = new Set(overdue.map((o: any) => String(o?.service_id)));
    (scheduledServicesData ?? []).forEach((s: any) => {
      const day = parseDay(s?.schedule?.scheduled_day);
      if (!day || day < today || day >= limit) return;
      if (overdueIds.has(String(s?.service_id))) return;
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
   * Resumo do dia: paragens, janela horária e quilómetros somados.
   *
   * É o que falta para o técnico planear — ver o dia como uma sequência, e
   * não como cartões soltos. NÃO se desenhou um mapa de rota a bordo de
   * propósito: o Google Maps e o Waze fazem multi-paragem com trânsito e
   * recálculo, e a app já os abre pelo seletor de navegação. Duplicar isso
   * seria pior e mais caro (waypoints da Directions API) do que dar aqui a
   * informação de decisão e deixar a navegação a quem a faz melhor.
   */
  const daySummary = (items: any[]) => {
    const km = items.reduce((sum: number, i: any) => {
      const d = Number(i?.distance);
      return Number.isFinite(d) && d > 0 ? sum + d : sum;
    }, 0);
    const starts = items
      .map((i: any) => hhmm(i?.schedule?.scheduled_time?.start))
      .filter(Boolean)
      .sort();
    const window = starts.length > 1 ? `${starts[0]}–${starts[starts.length - 1]}` : starts[0] ?? '';
    return { stops: items.length, km, window };
  };


  const visibleKeys = (selectedDay ? [selectedDay] : Object.keys(groups)).sort();

  /**
   * Com um dia escolhido na fita, "Em atraso" segue o filtro: ver a agenda de
   * quinta e ter lá em cima um serviço de terça é responder a uma pergunta que
   * não foi feita.
   */
  const visibleOverdue = useMemo(() => {
    if (!selectedDay) return overdue;
    return overdue.filter((s: any) => {
      const day = parseDay(s?.schedule?.scheduled_day);
      return day ? keyOf(day) === selectedDay : false;
    });
  }, [overdue, selectedDay]);

  /**
   * Total dos sete dias da fita — nem mais nem menos. Um serviço em atraso de
   * ontem aparece na secção "Em atraso" mas não entra aqui: a linha responde a
   * "o que tenho pela frente", e ontem já não está pela frente.
   */
  const weekSummary = useMemo(() => {
    const keys = new Set(weekDays.map((d) => keyOf(d)));
    const items = (scheduledServicesData ?? []).filter((s: any) => {
      const day = parseDay(s?.schedule?.scheduled_day);
      return day ? keys.has(keyOf(day)) : false;
    });
    return {
      stops: items.length,
      total: items.reduce((sum: number, i: any) => sum + (Number(i?.amount_for_vendor) || 0), 0),
    };
  }, [scheduledServicesData, weekDays]);

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
    <SafeAreaView className={`flex-1`} style={{ backgroundColor: Colors.bg }}>
      <View className="px-5 pt-4 pb-3 flex-row items-end justify-between">
        <CustomText size="subtitle" color="secondary" boldness="bolder">
          {t('tabs.agenda')}
        </CustomText>
        {/* Quanto trabalho tem pela frente, numa linha. O total por dia já
            estava nos cabeçalhos, mas ninguém somava a semana de cabeça — e é
            essa a pergunta de quem abre a agenda ao domingo à noite. */}
        {weekSummary.stops > 0 && (
          <CustomText size="extraSmall" color="muted" classes="mb-1">
            {t('agenda.week_summary', {
              count: weekSummary.stops,
              total: renderMoney(weekSummary.total) || '',
            })}
          </CustomText>
        )}
      </View>

      {/* Fita de semana */}
      <View className="px-5 pb-4">
        <View className="flex-row" style={{ gap: 8 }}>
          {weekDays.map((d) => {
            const k = keyOf(d);
            const hasItems = (groups[k]?.length ?? 0) > 0;
            const isSelected = selectedDay === k;
            const isToday = k === keyOf(today);
            const isOff = unavailable.isUnavailable(k);
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
                onLongPress={() => unavailable.toggle(k)}
                delayLongPress={400}
                accessibilityHint={t('agenda.unavailable_hint')}
                className="flex-1 items-center rounded-2xl border py-2.5"
                style={{
                  borderColor: isOff ? Colors.danger : isSelected ? Colors.brand : Colors.line,
                  backgroundColor: isOff
                    ? 'rgba(255,90,95,0.10)'
                    : isSelected ? 'rgba(250,187,91,0.12)' : Colors.card,
                }}
              >
                <CustomText size="extraSmall" color="muted">
                  {WEEKDAY_LETTERS[d.getDay()]}
                </CustomText>
                {/* Hoje a amarelo mesmo sem estar selecionado: sem isto os
                    sete dias liam-se todos iguais e era preciso contar para
                    saber em que dia se está. */}
                <CustomText
                  size="medium"
                  color={isOff ? 'muted' : isToday && !isSelected ? 'brand' : 'secondary'}
                  boldness="bolder"
                  classes="mt-0.5"
                  style={isOff ? { textDecorationLine: 'line-through' } : undefined}
                >
                  {d.getDate()}
                </CustomText>
                {/* Indisponível manda no ponto: o âmbar de "tens serviços"
                    perde o sentido num dia em que não vais trabalhar. */}
                <View
                  className="rounded-full mt-1"
                  style={{
                    width: 5, height: 5,
                    backgroundColor: isOff ? Colors.danger : hasItems ? Colors.brand : 'transparent',
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
        {/* Com um dia escolhido, a saída tinha de ser adivinhada (tocar outra
            vez no mesmo dia da fita). Um botão diz como se volta à semana. */}
        {selectedDay && (
          <TouchOpacity
            rounded="full"
            itemsCenter
            onPress={() => setSelectedDay(null)}
            otherClasses="self-start flex-row px-3 py-1.5 mb-4 border border-line"
          >
            <Feather name="arrow-left" size={13} color={Colors.muted} />
            <CustomText color="muted" size="extraSmall" boldness="bold" classes="ml-1.5">
              {t('agenda.show_week')}
            </CustomText>
          </TouchOpacity>
        )}

        {/* EM ATRASO primeiro: é o que exige ação e o que ninguém lhe mostrava. */}
        {visibleOverdue.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="alert-triangle" size={16} color={Colors.warning} />
              <CustomText size="medium" color="secondary" boldness="bold" classes="ml-2">
                {t('agenda.overdue_title')}
              </CustomText>
            </View>
            <View style={{ gap: 10 }}>
              {visibleOverdue.map((item: any, i: number) => (
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
                <View className="flex-row items-center justify-between mb-1">
                  <CustomText size="medium" color="secondary" boldness="bold">
                    {dayTitle(date)}
                  </CustomText>
                  <CustomText size="medium" color="brand" boldness="bolder">
                    {renderMoney(dayTotal(items)) || '0,00 €'}
                  </CustomText>
                </View>
                {/* Só com 2+ paragens: para um serviço só, a informação já
                    está toda no cartão e isto seria repetição. */}
                {items.length > 1 && (() => {
                  const sum = daySummary(items);
                  return (
                    <CustomText size="extraSmall" color="muted" classes="mb-3" numberOfLines={1}>
                      {[
                        t('agenda.day_stops', { count: sum.stops }),
                        sum.window,
                        sum.km > 0 ? `${sum.km.toFixed(1)} km` : null,
                      ].filter(Boolean).join(' · ')}
                    </CustomText>
                  );
                })()}
                {items.length <= 1 && <View className="mb-2" />}

                <View style={{ gap: 10 }}>
                  {items.map((item: any, i: number) => {
                    const start = hhmm(item?.schedule?.scheduled_time?.start);
                    const end = hhmm(item?.schedule?.scheduled_time?.end);
                    const ui = statusUi(item);
                    const serviceName = item?.service_type?.name ?? '—';
                    // A RUA, não a cidade: `customer.address` é "Cidade, Estado"
                    // e o técnico já sabe em que cidade trabalha.
                    const street = formatStreetLine(item?.address_details, item?.customer?.address);
                    // "a 9 km" ao lado da rua: é o que diz ao técnico se
                    // consegue encadear este serviço com o anterior.
                    const distanceLabel = formatDistanceKm(item?.distance);

                    const attendance = attendanceState(item);
                    const recurrenceKey = recurrenceLabelKey(item);
                    return (
                      <TouchableOpacity
                        key={`${k}-${i}`}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        // Sem o preço, tal como no cartão: o leitor de ecrã
                        // deve dizer o que lá está, não mais do que isso.
                        accessibilityLabel={[
                          start,
                          serviceName,
                          street,
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
                        <Card>
                        <View className="flex-row items-center">
                          {/* Hora primeiro: numa agenda é por ela que se lê o dia.
                              A de fim vem por baixo, mais pequena: é o que diz
                              ao técnico se ainda apanha o serviço seguinte. */}
                          <View className="items-center" style={{ width: 52 }}>
                            <CustomText color="secondary" boldness="bolder" size="medium">
                              {start || '--:--'}
                            </CustomText>
                            {!!end && (
                              <CustomText color="muted" size="extraSmall" classes="mt-0.5">
                                {end}
                              </CustomText>
                            )}
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
                            {/* Quem vai receber. Chegar e chamar a pessoa pelo
                                nome é metade da primeira impressão. */}
                            {!!item?.customer?.name && (
                              <View className="flex-row items-center mt-0.5">
                                <Feather name="user" size={12} color={Colors.muted} />
                                <CustomText color="muted" size="small" numberOfLines={1} classes="ml-1.5 flex-1">
                                  {item.customer.name}
                                </CustomText>
                              </View>
                            )}
                          </View>

                          {/* Sem o valor por serviço: o total do dia está no
                              cabeçalho, e um preço repetido em cada linha rouba
                              o espaço a quem se lê primeiro numa agenda — a
                              hora, o serviço e a morada. */}
                          <Feather name="chevron-right" size={18} color={Colors.muted} style={{ marginLeft: 8 }} />
                        </View>

                        {/* Uma linha só para os estados: a etiqueta de estado
                            (a caminho, em execução), a recorrência e a
                            confirmação diziam a mesma coisa — "como está este
                            serviço" — e ocupavam três linhas separadas. */}
                        {(ui.label || recurrenceKey || attendance === 'confirmed') && (
                          <View className="flex-row flex-wrap items-center mt-3 ml-[67px]" style={{ gap: 8 }}>
                            {ui.label ? <StatusPill color={ui.accent} label={ui.label} /> : null}
                            {recurrenceKey ? <StatusPill color={Colors.brand} label={t(recurrenceKey)} /> : null}
                            {attendance === 'confirmed' ? (
                              <View className="flex-row items-center">
                                <Feather name="check-circle" size={13} color={Colors.success} />
                                <CustomText color="success" size="extraSmall" boldness="bold" classes="ml-1.5">
                                  {t('schedules.attendance_confirmed')}
                                </CustomText>
                              </View>
                            ) : null}
                          </View>
                        )}

                        {/* Confirmação de presença: aparece a partir das 72h e
                            só enquanto não estiver confirmada. Fora dessa
                            janela seria ruído — confirmar com duas semanas de
                            antecedência não diz nada sobre o dia. */}
                        {attendance === 'pending' ? (
                          // Um só botão. Os detalhes abrem-se tocando no
                          // cartão — ter os dois lado a lado punha a decisão
                          // (confirmar) a competir com a consulta, e é a
                          // decisão que trava o cliente à espera em casa.
                          <TouchOpacity
                            rounded="lg"
                            itemsCenter
                            disabled={confirmingId === item?.schedule_id}
                            onPress={() => confirmAttendance(item)}
                            otherClasses={`mt-3 py-2.5 ${confirmingId === item?.schedule_id ? 'opacity-60' : ''}`}
                            bgColor="support_primary"
                          >
                            <CustomText color="strongest" boldness="semiBold" size="small">
                              {t('schedules.confirm_attendance')}
                            </CustomText>
                          </TouchOpacity>
                        ) : null}
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
