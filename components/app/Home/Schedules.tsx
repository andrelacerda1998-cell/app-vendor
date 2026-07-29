import { View } from "react-native";
import React from "react";
import { router } from "expo-router";
import { CustomText } from "@/components/CustomText";
import TouchOpacity from "@/components/TouchOpacity";
import { Colors } from "@/constants/Colors";
import CalendarIcon from "@/assets/icons/calendar";
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

  const goToSchedules = () =>
    router.push(`/(app)/(bottom-sheets)/(services)/schedules/${schedulesSection.today}`);

  const price = next ? renderMoney(next.amount_for_vendor ?? null) : false;
  const metaLine = next
    ? [
        next.schedule?.date_label ? t(`schedules.date_label.${next.schedule.date_label}`) : null,
        next.schedule?.scheduled_time?.start?.slice(0, 5),
        next.customer?.name,
      ].filter(Boolean).join(" · ")
    : "";

  return (
    <View className="px-5">
      <SectionHeader title={t("schedules.next_title")} />
      <View>
        {!next ? (
          // Estado vazio
          <TouchOpacity
            onPress={goToSchedules}
            bgColor="card"
            rounded="2xl"
            border
            borderColor="line"
            otherClasses="flex-row items-center p-4"
          >
            {/* Estado vazio em cinzento, não em âmbar: não há serviço nenhum,
                e a cor da marca não deve prometer conteúdo que não existe. */}
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: Colors.card_high }}
            >
              <CalendarIcon color={Colors.muted} />
            </View>
            <CustomText color="muted" boldness="medium" size="medium" classes="flex-1">
              {t("schedules.empty")}
            </CustomText>
            <Feather name="chevron-right" size={22} color={Colors.muted} />
          </TouchOpacity>
        ) : (
          // Próximo serviço
          <TouchOpacity
            onPress={goToSchedules}
            bgColor="card"
            rounded="2xl"
            border
            borderColor="line"
            otherClasses="p-4"
          >
            {next.schedule?.date_label === "today" && (
              <View className="flex-row justify-end mb-2">
                <View className="rounded-full px-2 py-[3px] bg-brand_soft">
                  <CustomText color="brand" size="extraSmall" boldness="bolder">
                    {t(`schedules.date_label.${next.schedule.date_label}`)}
                  </CustomText>
                </View>
              </View>
            )}
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-xl items-center justify-center mr-3 bg-brand_soft">
                <CalendarIcon color={Colors.brand} />
              </View>
              <View className="flex-1">
                <CustomText color="secondary" boldness="semiBold" size="medium" numberOfLines={1}>
                  {next.service_type?.name ?? t("schedules.agenda")}
                </CustomText>
                {metaLine ? (
                  <CustomText color="muted" size="small" numberOfLines={1} classes="mt-0.5">
                    {metaLine}
                  </CustomText>
                ) : null}
              </View>
              {price ? (
                <CustomText color="secondary" boldness="bolder" size="medium" classes="ml-2">
                  {price}
                </CustomText>
              ) : null}
            </View>
          </TouchOpacity>
        )}
      </View>
    </View>
  );
}

export default Schedules;
