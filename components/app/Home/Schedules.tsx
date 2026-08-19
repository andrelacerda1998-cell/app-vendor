import { View } from "react-native";
import React from "react";
import { router } from "expo-router";
import { CustomText } from "@/components/CustomText";
import TouchOpacity from "@/components/TouchOpacity";
import { Colors } from "@/constants/Colors";
import AgendaFree from "@/assets/icons/agenda-free";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/ui";
import { useSchedule } from "@/contexts/ScheduleContext";
import { renderMoney } from "@/utils/money";

export const schedulesSection = {
  all: "all",
  today: "today",
}

const hhmm = (t?: string) => (t ? String(t).slice(0, 5) : "");

const Schedules = () => {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();
  const list = scheduledServicesData ?? [];

  // Abre o separador Agenda (fita da semana + serviços por dia).
  const goToSchedules = () => router.navigate('/(app)/(tabs)/wallet');

  // HOJE é o foco do cartão: quantos serviços, a hora do próximo e o total do
  // dia. (O antigo cartão "Hoje" do topo dizia o mesmo — foi removido.)
  const todayList = list.filter((s) => s?.schedule?.date_label === 'today');
  const hasToday = todayList.length > 0;
  const todayTotal = renderMoney(
    todayList.reduce((sum, s) => sum + (s.amount_for_vendor ?? 0), 0)
  );

  // Próxima paragem = a hora de início mais cedo ainda por acontecer; se já
  // passaram todas, a mais cedo do dia.
  const nextStart = (() => {
    if (!hasToday) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const starts = todayList
      .map((s) => hhmm(s.schedule?.scheduled_time?.start))
      .filter((h) => /^\d{2}:\d{2}$/.test(h))
      .sort();
    const upcoming = starts.find((h) => {
      const [hh, mm] = h.split(':').map(Number);
      return hh * 60 + mm >= nowMin;
    });
    return upcoming ?? starts[0] ?? null;
  })();

  /**
   * Sem nada hoje, mostramos o próximo serviço FUTURO.
   *
   * O `list` passou a incluir agendamentos passados (a Agenda mostra-os em
   * "Em atraso"), por isso é preciso filtrar: sem isto, a Home anunciava como
   * "Próximo serviço" uma data que já tinha passado.
   */
  const upcoming = (() => {
    if (hasToday) return null;
    const todayKey = new Date().toISOString().slice(0, 10);
    const future = list
      .filter((s) => String(s?.schedule?.scheduled_day ?? '').split('T')[0] >= todayKey)
      .sort((a, b) =>
        String(a?.schedule?.scheduled_day).localeCompare(String(b?.schedule?.scheduled_day))
      );
    return future[0] ?? null;
  })();

  const upcomingWhen = (() => {
    if (!upcoming) return '';
    const label = upcoming.schedule?.date_label;
    let day = '';
    if (label === 'today' || label === 'tomorrow') {
      day = t(`schedules.date_label.${label}`);
    } else {
      const iso = String(upcoming.schedule?.scheduled_day ?? '').split('T')[0];
      const [y, m, d] = iso.split('-').map(Number);
      if (y && m && d) day = new Date(y, m - 1, d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    }
    return [day, hhmm(upcoming.schedule?.scheduled_time?.start)].filter(Boolean).join(' · ');
  })();
  const upcomingPrice = upcoming ? renderMoney(upcoming.amount_for_vendor ?? null) : false;

  // Cartão plano, igual aos restantes do ecrã: ícone + (título / quando) à
  // esquerda, valor à direita. Sem gradientes nem glow — a consistência com os
  // outros cartões é o que o faz parecer arrumado.
  const Row = ({ title, when, value }: { title: string; when: string; value: string | false }) => (
    <TouchOpacity
      onPress={goToSchedules}
      bgColor="card"
      rounded="2xl"
      border
      borderColor="line"
      otherClasses="flex-row items-center p-5"
    >
      <View className="w-12 h-12 rounded-2xl items-center justify-center bg-brand_soft">
        <Feather name="calendar" size={22} color={Colors.brand} />
      </View>
      <View className="flex-1 ml-3.5">
        <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={1}>
          {title}
        </CustomText>
        {when ? (
          <CustomText color="brand" size="small" boldness="bold" classes="mt-1" numberOfLines={1}>
            {when}
          </CustomText>
        ) : null}
      </View>
      {/* Rótulo por cima do montante: sem ele o número ficava sem contexto —
          podia ler-se como o preço de um serviço e não como o total do dia. */}
      {value ? (
        <View className="items-end ml-3">
          <CustomText color="muted" size="extraSmall">
            {t("schedules.day_total")}
          </CustomText>
          <CustomText color="brand" boldness="bolder" size="large" classes="mt-0.5">
            {value}
          </CustomText>
        </View>
      ) : null}
    </TouchOpacity>
  );

  return (
    <View className="px-5">
      <SectionHeader title={t("schedules.section_title")} />
      {hasToday ? (
        <Row
          title={t("schedules.today_count", { count: todayList.length })}
          when={nextStart ? t("schedules.next_at", { time: nextStart }) : ""}
          value={todayTotal}
        />
      ) : upcoming ? (
        <Row title={t("schedules.next_service")} when={upcomingWhen} value={upcomingPrice} />
      ) : (
        // Estado vazio: ilustração + texto centrados, cartão tocável.
        <TouchOpacity
          onPress={goToSchedules}
          bgColor="card"
          rounded="2xl"
          border
          borderColor="line"
          otherClasses="flex-row items-center justify-center p-5"
        >
          <View className="mr-3">
            <AgendaFree color={Colors.muted} accent={Colors.success} size={40} />
          </View>
          <CustomText color="secondary" boldness="semiBold" size="medium">
            {t("schedules.empty")}
          </CustomText>
        </TouchOpacity>
      )}
    </View>
  );
}

export default Schedules;
