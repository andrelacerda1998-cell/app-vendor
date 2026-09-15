import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { Card, SectionHeader } from '@/components/ui';
import AgendaFree from '@/assets/icons/agenda-free';
import { useSchedule } from '@/contexts/ScheduleContext';
import { renderMoney } from '@/utils/money';
import { formatStreetLine } from '@/utils/serviceDetails';
import { needsAttendanceConfirmation, scheduleStartsAt } from '@/utils/attendance';

const hhmm = (t?: string) => (t ? String(t).slice(0, 5) : '');

/**
 * HOJE — o proximo servico, em concreto, e o que ha a fazer com ele.
 *
 * Aqui estavam dois cartoes encostados a falar da mesma agenda: um verde a
 * dizer "tens 2 servicos por confirmar" e outro a dizer "1 servico hoje,
 * proximo as 16:00". Duas vistas do mesmo assunto, e nenhuma delas dizia QUAL
 * e o servico — o tecnico tinha de abrir a Agenda para saber a quem ia.
 *
 * Passa a um bloco: hora, o que e, onde, quanto rende. A confirmacao de
 * presenca, quando falta, vive dentro dele — e uma accao sobre este servico,
 * nao um aviso a parte.
 *
 * Sem o nome do cliente: na Home basta saber que servico e a que horas, e o
 * nome fica no cartao da Agenda e no ecra do servico, onde serve mesmo para
 * alguma coisa (chegar e chamar a pessoa pelo nome).
 *
 * Sem nada hoje, mostra o proximo dia com trabalho; sem nada de todo, diz-lo
 * e explica onde aparecem os servicos aceites.
 */
const TodayCard = () => {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();
  const list = scheduledServicesData ?? [];

  const goToAgenda = () => router.navigate('/(app)/(tabs)/wallet');

  const hoje = list.filter((s) => s?.schedule?.date_label === 'today');

  // O proximo da lista: o mais cedo que ainda esta para vir. Se ja passaram
  // todos, o primeiro do dia — continua a ser o que interessa ver.
  const porVir = [...list]
    .filter((s) => (scheduleStartsAt(s) ?? 0) >= Date.now())
    .sort((a, b) => (scheduleStartsAt(a) ?? 0) - (scheduleStartsAt(b) ?? 0));
  const proximo = porVir[0] ?? hoje[0] ?? null;

  const porConfirmar = list.filter(needsAttendanceConfirmation).length;

  // Vazio: um cartao tocavel que explica, em vez de uma linha solta.
  if (!proximo) {
    return (
      <View className="px-5">
        <SectionHeader title={t('home_today.title')} />
        <TouchableOpacity activeOpacity={0.85} onPress={goToAgenda}>
          <Card className="flex-row items-center">
            <View className="mr-3.5">
              <AgendaFree color={Colors.muted} accent={Colors.success} size={38} />
            </View>
            <View className="flex-1">
              <CustomText color="secondary" boldness="bold" size="medium">
                {t('schedules.empty')}
              </CustomText>
              <CustomText color="muted" size="small" classes="mt-1" numberOfLines={2}>
                {t('schedules.empty_hint')}
              </CustomText>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.muted} />
          </Card>
        </TouchableOpacity>
      </View>
    );
  }

  const inicio = hhmm(proximo?.schedule?.scheduled_time?.start);
  const fim = hhmm(proximo?.schedule?.scheduled_time?.end);
  const rotulo = proximo?.schedule?.date_label;
  const nome = proximo?.service_type?.name ?? '—';
  const rua = formatStreetLine(proximo?.address_details, proximo?.customer?.address);
  const valor = renderMoney(proximo?.amount_for_vendor ?? null);

  // "Hoje" so quando e mesmo hoje: com o proximo servico a ser quinta-feira,
  // um cabecalho a dizer "Hoje" mentia.
  const titulo = rotulo === 'today'
    ? t('home_today.title')
    : rotulo === 'tomorrow'
      ? t('home_today.tomorrow')
      : t('schedules.next_service');

  return (
    <View className="px-5">
      <SectionHeader
        title={titulo}
        action={hoje.length > 1 ? t('home_today.count_more', { count: hoje.length - 1 }) : undefined}
        onAction={hoje.length > 1 ? goToAgenda : undefined}
      />

      <Card padded={false}>
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={[inicio, nome, rua].filter(Boolean).join(', ')}
          onPress={() => router.push(`/(app)/(services)/(open)/status/${proximo?.service_id}`)}
          className="flex-row items-center p-4"
        >
          {/* A hora primeiro: e por ela que se le uma agenda. */}
          <View className="items-center" style={{ width: 52 }}>
            <CustomText color="secondary" boldness="bolder" size="medium">
              {inicio || '--:--'}
            </CustomText>
            {!!fim && (
              <CustomText color="muted" size="extraSmall" classes="mt-0.5">
                {fim}
              </CustomText>
            )}
          </View>

          <View
            className="self-stretch mx-3"
            style={{ width: 2, borderRadius: 1, backgroundColor: Colors.brand }}
          />

          <View className="flex-1">
            <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
              {nome}
            </CustomText>
            {!!rua && (
              <View className="flex-row items-center mt-0.5">
                <Feather name="map-pin" size={12} color={Colors.muted} />
                <CustomText color="muted" size="small" numberOfLines={1} classes="ml-1.5 flex-1">
                  {rua}
                </CustomText>
              </View>
            )}
          </View>

          {/* Quanto rende ESTE servico. O total do dia vivia aqui e competia
              com os ganhos da semana, logo por baixo, a dizer outra coisa. */}
          {valor ? (
            <CustomText color="brand" boldness="bolder" size="medium" classes="ml-2">
              {valor}
            </CustomText>
          ) : null}
        </TouchableOpacity>

        {/* A confirmacao e uma accao sobre o que esta aqui em cima, e nao um
            aviso a parte: fica dentro do cartao, por baixo de uma linha. */}
        {porConfirmar > 0 && (
          <View className="px-4 pb-4">
            <TouchableOpacity
              activeOpacity={0.85}
              accessibilityRole="button"
              onPress={goToAgenda}
              className="flex-row items-center justify-center rounded-xl py-2.5"
              style={{ backgroundColor: Colors.success }}
            >
              <Feather name="check" size={16} color={Colors.strongest} />
              <CustomText color="strongest" boldness="bold" size="small" classes="ml-2">
                {t('schedules.attendance_nudge_action', { count: porConfirmar })}
              </CustomText>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </View>
  );
};

export default TodayCard;
