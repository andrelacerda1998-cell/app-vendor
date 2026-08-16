import { View, StyleSheet } from "react-native";
import React from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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

// Contorno e brilho âmbar ténues: dão calor ao cartão e destacam-no dos cartões
// planos, sem gritar. Mesma família do brilho do topo da Home.
const BRAND_BORDER = "rgba(250,187,91,0.28)";
const GRADIENT = ["rgba(250,187,91,0.12)", "rgba(250,187,91,0.02)"] as const;

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

  // Sem nada hoje, mostramos o próximo serviço futuro (para não esconder um
  // agendamento de amanhã), ou o estado vazio.
  const upcoming = !hasToday && list.length > 0 ? list[0] : null;

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

  // Ícone em quadro âmbar suave — arredondado e com um leve anel âmbar.
  const IconTile = () => (
    <View
      className="w-12 h-12 rounded-2xl items-center justify-center mr-3 bg-brand_soft"
      style={{ borderWidth: 1, borderColor: BRAND_BORDER }}
    >
      <Feather name="calendar" size={20} color={Colors.brand} />
    </View>
  );

  // Valor como "stat": rótulo pequeno por cima, montante âmbar em destaque.
  const MoneyStat = ({ value }: { value: string }) => (
    <View className="items-end mr-1.5">
      <CustomText color="muted" size="extraSmall" classes="mb-0.5">
        {t("schedules.to_receive")}
      </CustomText>
      <CustomText color="brand" boldness="bolder" size="medium">
        {value}
      </CustomText>
    </View>
  );

  return (
    <View className="px-5">
      <SectionHeader title={t("schedules.section_title")} />
      <View>
        {hasToday ? (
          // HOJE: nº de serviços + hora do próximo + total do dia.
          <TouchOpacity
            onPress={goToSchedules}
            bgColor="card"
            rounded="2xl"
            otherClasses="overflow-hidden"
            style={{ borderWidth: 1, borderColor: BRAND_BORDER }}
          >
            <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View className="flex-row items-center p-4">
              <IconTile />
              <View className="flex-1">
                <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={1}>
                  {t("schedules.today_count", { count: todayList.length })}
                </CustomText>
                {nextStart ? (
                  <View className="flex-row items-center mt-1">
                    <Feather name="clock" size={14} color={Colors.brand} />
                    <CustomText color="secondary" size="small" boldness="semiBold" classes="ml-1.5" numberOfLines={1}>
                      {t("schedules.next_at", { time: nextStart })}
                    </CustomText>
                  </View>
                ) : null}
              </View>
              {todayTotal ? <MoneyStat value={todayTotal} /> : null}
              <Feather name="chevron-right" size={20} color={Colors.muted} />
            </View>
          </TouchOpacity>
        ) : upcoming ? (
          // Nada hoje, mas há um serviço num próximo dia.
          <TouchOpacity
            onPress={goToSchedules}
            bgColor="card"
            rounded="2xl"
            otherClasses="overflow-hidden"
            style={{ borderWidth: 1, borderColor: BRAND_BORDER }}
          >
            <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View className="flex-row items-center p-4">
              <IconTile />
              <View className="flex-1">
                <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={1}>
                  {t("schedules.next_service")}
                </CustomText>
                {upcomingWhen ? (
                  <View className="flex-row items-center mt-1">
                    <Feather name="clock" size={14} color={Colors.brand} />
                    <CustomText color="secondary" size="small" boldness="semiBold" classes="ml-1.5" numberOfLines={1}>
                      {upcomingWhen}
                    </CustomText>
                  </View>
                ) : null}
              </View>
              {upcomingPrice ? <MoneyStat value={upcomingPrice} /> : null}
              <Feather name="chevron-right" size={20} color={Colors.muted} />
            </View>
          </TouchOpacity>
        ) : (
          // Estado vazio: ilustração + texto centrados, cartão neutro (sem
          // brilho — não há nada a celebrar) mas na mesma tocável.
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
    </View>
  );
}

export default Schedules;
