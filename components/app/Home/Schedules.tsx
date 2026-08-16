import { View } from "react-native";
import React from "react";
import { router } from "expo-router";
import { CustomText } from "@/components/CustomText";
import TouchOpacity from "@/components/TouchOpacity";
import { Colors } from "@/constants/Colors";
import CalendarIcon from "@/assets/icons/calendar";
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

const Schedules = () => {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();
  const hasSchedules = scheduledServicesData && scheduledServicesData.length > 0;
  const next = hasSchedules ? scheduledServicesData[0] : null;

  // Abre o separador Agenda (com a tira da semana e os serviços por dia), e não
  // a lista simples do bottom-sheet — é a vista que o técnico reconhece como
  // "a agenda". O "Ver todos" lá dentro é que leva à lista detalhada.
  const goToSchedules = () => router.navigate('/(app)/(tabs)/wallet');

  const price = next ? renderMoney(next.amount_for_vendor ?? null) : false;
  // Só o "quando" (dia + hora) — o essencial de relance. A rua e o resto vivem
  // no ecrã do serviço, que abre ao tocar; amontoá-los aqui só apertava o cartão.
  const metaLine = next
    ? [
        next.schedule?.date_label ? t(`schedules.date_label.${next.schedule.date_label}`) : null,
        next.schedule?.scheduled_time?.start?.slice(0, 5),
      ].filter(Boolean).join(" · ")
    : "";

  return (
    <View className="px-5">
      <SectionHeader title={t("schedules.section_title")} />
      <View>
        {!next ? (
          // Estado vazio
          <TouchOpacity
            onPress={goToSchedules}
            bgColor="card"
            rounded="2xl"
            border
            borderColor="line"
            otherClasses="flex-row items-center justify-center p-4"
          >
            {/* Estado vazio: ilustração + texto centrados no ecrã, texto em
                branco. Sem seta — o layout centrado não é uma linha de lista, e
                o cartão inteiro continua tocável. */}
            <View className="mr-3">
              <AgendaFree color={Colors.muted} accent={Colors.success} size={40} />
            </View>
            <CustomText color="secondary" boldness="semiBold" size="medium">
              {t("schedules.empty")}
            </CustomText>
          </TouchOpacity>
        ) : (
          // Próximo serviço — toca para abrir ESSE serviço (não a agenda toda).
          <TouchOpacity
            onPress={() => router.push(`/(app)/(services)/(open)/status/${next.service_id}`)}
            bgColor="card"
            rounded="2xl"
            border
            borderColor="line"
            otherClasses="flex-row items-center p-4"
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center mr-3 bg-brand_soft">
              <CalendarIcon color={Colors.brand} />
            </View>
            <View className="flex-1">
              <CustomText color="secondary" boldness="semiBold" size="medium" numberOfLines={1}>
                {next.service_type?.name ?? t("schedules.agenda")}
              </CustomText>
              {/* Meta = dia + hora (o "quando"). */}
              {metaLine ? (
                <CustomText color="muted" size="small" numberOfLines={1} classes="mt-0.5">
                  {metaLine}
                </CustomText>
              ) : null}
            </View>
            {price ? (
              <CustomText color="brand" boldness="bolder" size="medium" classes="ml-2">
                {price}
              </CustomText>
            ) : null}
            <Feather name="chevron-right" size={20} color={Colors.muted} style={{ marginLeft: 6 }} />
          </TouchOpacity>
        )}
      </View>
    </View>
  );
}

export default Schedules;
