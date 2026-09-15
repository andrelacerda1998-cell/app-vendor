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
import { formatShortDate } from '@/utils/date';
import { scheduleStartsAt } from '@/utils/attendance';

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

  /**
   * Os que ainda estao para vir, do mais cedo para o mais tarde.
   *
   * Mostrava-se so o proximo e um "+2 hoje" — o tecnico sabia que havia mais
   * mas nao a que horas, e tinha de abrir a Agenda para planear a tarde. Com
   * tres linhas ve o dia de relance.
   */
  const porVir = [...list]
    .filter((s) => (scheduleStartsAt(s) ?? 0) >= Date.now())
    .sort((a, b) => (scheduleStartsAt(a) ?? 0) - (scheduleStartsAt(b) ?? 0));

  const MAX_LINHAS = 3;
  const proximos = (porVir.length > 0 ? porVir : hoje).slice(0, MAX_LINHAS);
  const proximo = proximos[0] ?? null;

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

  /**
   * O titulo segue o que esta na lista: "HOJE" so quando todas as linhas sao
   * de hoje. Com servicos de dias diferentes a mesma lista, um cabecalho a
   * dizer "Hoje" mentia sobre metade dela.
   */
  const todasHoje = proximos.every((s) => s?.schedule?.date_label === 'today');
  const titulo = todasHoje
    ? t('home_today.title')
    : proximos[0]?.schedule?.date_label === 'tomorrow' && proximos.length === 1
      ? t('home_today.tomorrow')
      : t('home_today.next_title');

  return (
    <View className="px-5">
      <SectionHeader title={titulo} />

      <Card padded={false}>
        {proximos.map((servico: any, i: number) => {
          const inicio = hhmm(servico?.schedule?.scheduled_time?.start);
          const fim = hhmm(servico?.schedule?.scheduled_time?.end);
          const nome = servico?.service_type?.name ?? '—';
          const rua = formatStreetLine(servico?.address_details, servico?.customer?.address);
          const valor = renderMoney(servico?.amount_for_vendor ?? null);
          // O dia so aparece quando NAO e hoje: repeti-lo em todas as linhas de
          // uma lista que e quase sempre do proprio dia era ruido.
          const dia = servico?.schedule?.date_label === 'today'
            ? null
            : servico?.schedule?.date_label === 'tomorrow'
              ? t('schedules.date_label.tomorrow')
              : formatShortDate(servico?.schedule?.scheduled_day);

          return (
            <View key={servico?.service_id ?? i}>
              {i > 0 && <View style={{ height: 1, backgroundColor: Colors.line }} />}
              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={[dia, inicio, nome, rua].filter(Boolean).join(', ')}
                onPress={() => router.push(`/(app)/(services)/(open)/status/${servico?.service_id}`)}
                className="flex-row items-center p-4"
              >
                {/* A hora primeiro: e por ela que se le uma agenda. */}
                <View className="items-center" style={{ width: 52 }}>
                  <CustomText color="secondary" boldness="bolder" size="medium">
                    {inicio || '--:--'}
                  </CustomText>
                  <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={1}>
                    {dia ?? fim}
                  </CustomText>
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

                {valor ? (
                  <CustomText color="brand" boldness="bolder" size="medium" classes="ml-2">
                    {valor}
                  </CustomText>
                ) : null}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* "Ver tudo" fecha o cartao, no lugar onde estava o botao de
            confirmar presenca. A confirmacao passa a viver so na Agenda, onde
            cada dia tem o seu botao: confirmar e uma decisao por dia — dizer
            "amanha estou ca" nao e o mesmo que dizer "hoje estou ca" — e a
            Home juntava dias diferentes num toque so.

            Neutro, e nao verde: isto e navegacao, nao um compromisso. O verde
            fica reservado para o que o e. */}
        <View className="px-4 pb-4">
          <TouchableOpacity
            activeOpacity={0.85}
            accessibilityRole="button"
            onPress={goToAgenda}
            className="flex-row items-center justify-center rounded-xl border py-2.5"
            style={{ borderColor: Colors.line, backgroundColor: Colors.card_high }}
          >
            <CustomText color="secondary" boldness="semiBold" size="small">
              {t('home_today.see_all')}
            </CustomText>
            <Feather name="chevron-right" size={16} color={Colors.muted} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

      </Card>
    </View>
  );
};

export default TodayCard;
