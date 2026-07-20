import React, {useEffect, useState} from "react";
import {FlatList, SafeAreaView, ScrollView, View} from "react-native";
import {useTranslation} from "react-i18next";
import {router, useLocalSearchParams} from "expo-router";
import {Colors} from "@/constants/Colors";
import ArrowIcon from "@/assets/icons/arrow";
import TouchOpacity from "@/components/TouchOpacity";
import {CustomText} from "@/components/CustomText";
import {schedulesSection} from "@/components/app/Home/Schedules";
import {useSchedule} from "@/contexts/ScheduleContext";
import FilterChip from "@/components/app/FilterChip";
import {renderMoney} from "@/utils/money";
import {ServiceRequestedInterface, ServiceStatus} from "@/types/services";
import {useApi} from "@/contexts/ApiContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import {useDialog} from "@/contexts/DialogContext";
import {useService} from "@/contexts/ServiceContext";

const ServiceSchedulesBottomSheet = () => {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();
  const { schedule } = useLocalSearchParams();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { setOpenService, openService } = useService();
  // Control flag to allow starting a scheduled service at any time.
  const allowStartScheduleAnytime = false;

  const FILTERS = ["today", "tomorrow", "all"] as const;

  const getInitialFilter = (): typeof FILTERS[number] => {
    if (schedule === schedulesSection.today) {
      return 'today';
    } else if (schedule === schedulesSection.all) {
      return 'all';
    }
    return 'all';
  };

  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]>(getInitialFilter());
  const [scheduledServices, setScheduledServices] = useState<ServiceRequestedInterface[]>([]);
  const [allScheduledServices, setAllScheduledServices] = useState<ServiceRequestedInterface[]>(scheduledServicesData);

  const getStartMinutes = (service: ServiceRequestedInterface) => {
    const startTime = service.schedule?.scheduled_time?.start;
    if (!startTime) return Number.POSITIVE_INFINITY;

    const [hourRaw, minuteRaw] = startTime.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return Number.POSITIVE_INFINITY;
    }

    return (hour * 60) + minute;
  };

  const getScheduleTimestamp = (service: ServiceRequestedInterface) => {
    const startMinutes = getStartMinutes(service);
    if (!Number.isFinite(startMinutes)) return Number.POSITIVE_INFINITY;

    const scheduledDay = service.schedule?.scheduled_day?.trim();
    const hour = Math.floor(startMinutes / 60);
    const minute = startMinutes % 60;

    const buildTimestamp = (year: number, month: number, day: number) => (
      new Date(year, month, day, hour, minute).getTime()
    );

    if (scheduledDay) {
      if (scheduledDay.includes("T") || scheduledDay.includes(" ")) {
        const parsedDay = new Date(scheduledDay);
        if (Number.isFinite(parsedDay.getTime())) {
          return buildTimestamp(parsedDay.getFullYear(), parsedDay.getMonth(), parsedDay.getDate());
        }
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(scheduledDay)) {
        const [year, month, day] = scheduledDay.split("-").map((part) => Number(part));
        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
          return buildTimestamp(year, month - 1, day);
        }
      }

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(scheduledDay)) {
        const [day, month, year] = scheduledDay.split("/").map((part) => Number(part));
        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
          return buildTimestamp(year, month - 1, day);
        }
      }
    }

    const dateLabel = service.schedule?.date_label;
    if (dateLabel === "today" || dateLabel === "tomorrow") {
      const now = new Date();
      const offset = dateLabel === "tomorrow" ? 1 : 0;
      return buildTimestamp(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    }

    // Fallback: keep unknown dates at the end, still ordered by time.
    return (Number.MAX_SAFE_INTEGER / 2) + startMinutes;
  };

  const sortSchedulesByTime = (schedules: ServiceRequestedInterface[]) => {
    return [...schedules].sort((a, b) => {
      const timeDiff = getScheduleTimestamp(a) - getScheduleTimestamp(b);
      if (timeDiff !== 0) return timeDiff;
      return getStartMinutes(a) - getStartMinutes(b);
    });
  };

  useEffect(() => {
    if (!scheduledServicesData) return;

    const sortedSchedules = sortSchedulesByTime(scheduledServicesData);
    setScheduledServices(sortedSchedules);
    setAllScheduledServices(sortedSchedules);

    // Update filter based on route parameter
    if (schedule === schedulesSection.today) {
      setSelectedFilter('today');
    } else if (schedule === schedulesSection.all) {
      setSelectedFilter('all');
    }
  }, [scheduledServicesData, schedule]);

  const applyFilter = (filter: (typeof FILTERS)[number], schedules: ServiceRequestedInterface[]) => {
    return schedules.filter((s) => s.schedule.date_label.includes(filter));
  };

  useEffect(() => {
    if (selectedFilter === "all") {
      setScheduledServices(sortSchedulesByTime(allScheduledServices));
    } else {
      const filteredSchedules = applyFilter(selectedFilter, allScheduledServices);
      setScheduledServices(sortSchedulesByTime(filteredSchedules));
    }
  }, [selectedFilter, allScheduledServices]);

  const changeFilter = (filter: (typeof FILTERS)[number]) => {
    setSelectedFilter(filter);
  };

  const canGoToDestination = (service: ServiceRequestedInterface) => {
    const scheduledDay = service.schedule?.scheduled_day?.trim();
    const scheduledStart = service.schedule?.scheduled_time?.start;
    const dateLabel = service.schedule?.date_label;
    const serverTime = service.server_time?.trim();

    if (!scheduledDay || !scheduledStart) return false;

    const [hourPart, minutePart] = scheduledStart.split(":");
    const hour = Number(hourPart);
    const minute = Number(minutePart);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;

    const parseDateParts = (value: string): { year: number; month: number; day: number } | null => {
      const normalized = value.trim();

      const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);
        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
          return { year, month, day };
        }
      }

      const brMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (brMatch) {
        const day = Number(brMatch[1]);
        const month = Number(brMatch[2]);
        const year = Number(brMatch[3]);
        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
          return { year, month, day };
        }
      }

      if (normalized.includes("T")) {
        const [datePart] = normalized.split("T");
        return parseDateParts(datePart);
      }

      if (normalized.includes(" ")) {
        const [datePart] = normalized.split(" ");
        return parseDateParts(datePart);
      }

      return null;
    };

    const deviceNowMs = Date.now();
    const parsedServerNowMs = serverTime ? new Date(serverTime).getTime() : Number.NaN;
    const isServerNowValid = Number.isFinite(parsedServerNowMs);
    const serverDeviceDriftMs = isServerNowValid
      ? Math.abs(parsedServerNowMs - deviceNowMs)
      : Number.POSITIVE_INFINITY;
    const maxAcceptedDriftMs = 15 * 60 * 1000;
    const useServerNow = isServerNowValid && serverDeviceDriftMs <= maxAcceptedDriftMs;
    const nowMs = useServerNow ? parsedServerNowMs : deviceNowMs;

    const now = new Date(nowMs);
    const nowAtMinuteMs = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      0,
      0,
    ).getTime();

    const scheduledDate = parseDateParts(scheduledDay);
    let scheduledAt: number | null = null;

    if (scheduledDate) {
      scheduledAt = new Date(
        scheduledDate.year,
        scheduledDate.month - 1,
        scheduledDate.day,
        hour,
        minute,
        0,
        0,
      ).getTime();
    }

    if (scheduledAt === null && (dateLabel === "today" || dateLabel === "tomorrow")) {
      const baseDateFromServer = useServerNow && serverTime ? parseDateParts(serverTime) : null;
      const baseDate = baseDateFromServer ?? (() => {
        const localNow = new Date(nowMs);
        return {
          year: localNow.getFullYear(),
          month: localNow.getMonth() + 1,
          day: localNow.getDate(),
        };
      })();

      const dayOffset = dateLabel === "tomorrow" ? 1 : 0;
      const shiftedDate = new Date(Date.UTC(baseDate.year, baseDate.month - 1, baseDate.day + dayOffset));
      const year = shiftedDate.getUTCFullYear();
      const month = shiftedDate.getUTCMonth() + 1;
      const day = shiftedDate.getUTCDate();

      scheduledAt = new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
    }

    if (scheduledAt === null) return false;
    const oneHourMs = 60 * 60 * 1000;
    const unlockAtMs = scheduledAt - oneHourMs;
    return nowAtMinuteMs >= unlockAtMs;
  };

  const handleCancelSchedule = (service: ServiceRequestedInterface) => {
    const scheduleId = service.schedule_id;
    if (!scheduleId) return;

    openDialog({
      title: t("services.cancel.title"),
      subtitle: t("services.cancel.subtitle"),
      successButtonText: t("services.cancel.confirm"),
      cancelButtonText: t("services.cancel.cancel"),
      onSuccess() {
        api.post(API_ROUTES.VENDOR_CANCEL_SCHEDULE(scheduleId))
          .then(() => {
            setAllScheduledServices((prev) =>
              prev.filter((item) => item.service_id !== service.service_id),
            );
            setScheduledServices((prev) =>
              prev.filter((item) => item.service_id !== service.service_id),
            );
            openDialog({
              title: t("services.wait_accept.canceled.title"),
              subtitle: t("services.wait_accept.canceled.subtitle"),
              closeAfterMSeconds: 3000,
              closeOnClickOutside: false,
            });
          })
          .catch((err) => {
            console.error(err);
            openDialog({
              title: t("services.cancel.error.title"),
              subtitle: t("services.cancel.error.subtitle"),
              closeAfterMSeconds: 3000,
              closeOnClickOutside: true,
            });
          });
      },
    });
  };

  const handleGoToDestination = (service: ServiceRequestedInterface) => {
    const id = service.service_id;
    api.post(API_ROUTES.VENDOR_SCHEDULE_GO_TO_LOCATION(id)).then((res) => {
      const { service: openService } = res.data.data;
      setOpenService(openService);
      router.navigate(`/(app)/(services)/(open)/progress/${openService?.id}`);
    }).catch((err) => {
      console.error(err);
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 mt-10 bg-primary p-5">
        <View className="flex-row items-center justify-between mb-6">
          <TouchOpacity onPress={() => router.back()} otherClasses="h-10 w-10" itemsCenter>
            <ArrowIcon color={Colors.secondary} position="left" size="40%" />
          </TouchOpacity>
          <CustomText color="secondary" boldness="semiBold" classes="text-xl">
            {t("schedules.agenda")}
          </CustomText>
          <View className="h-10 w-10" />
        </View>

        <View className="mb-6" style={{ height: 40 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingRight: 12,
              alignItems: "center",
            }}
            style={{ height: 40 }}
          >
            {FILTERS.map((filter) => (
              <FilterChip
                key={filter}
                label={t(`schedules.filters.${filter}`)}
                active={selectedFilter === filter}
                onPress={() => changeFilter(filter)}
              />
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={scheduledServices}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <CustomText color="gray_medium" boldness="medium">
                {t("services.empty", { defaultValue: "You don't have any services yet" })}
              </CustomText>
            </View>
          }
          renderItem={({ item }) => {
            const allowGoToDestination = allowStartScheduleAnytime || canGoToDestination(item);
            const isScheduleInProgress =
              openService?.id === item.service_id &&
              (openService?.status === ServiceStatus.ACCEPTED ||
                openService?.status === ServiceStatus.ARRIVED);
            const startTime = item.schedule?.scheduled_time?.start?.slice(0, 5) || "";
            const endTime = item.schedule?.scheduled_time?.end?.slice(0, 5) || "";
            const dateLabel = item.schedule?.date_label
              ? t(`schedules.date_label.${item.schedule.date_label}`)
              : "";
            const timeLabel = [dateLabel, startTime && endTime ? `${startTime} - ${endTime}` : ""]
              .filter(Boolean)
              .join(" ");

            const priceLabel = renderMoney(item.amount_for_vendor);

            return (
              <View className="mb-4">
                <View className="rounded-2xl border border-[#2C2C2C] bg-[#1F1F1F] px-4 py-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center flex-wrap">
                        <CustomText color="secondary" boldness="semiBold" classes="text-lg">
                          {item.service_type?.name}
                        </CustomText>
                        {priceLabel ? (
                          <CustomText color="success" boldness="medium" classes="text-lg ml-2">
                            {priceLabel}
                          </CustomText>
                        ) : null}
                      </View>
                    </View>
                    <View className="h-8 w-8 items-center justify-center rounded-full border border-[#303030]">
                      <ArrowIcon color={Colors.link} position="right" size="45%" />
                    </View>
                  </View>

                  <View className="mt-3 space-y-2">
                    <View className="flex-row items-center">
                      <View className="h-2 w-2 rounded-full bg-support_primary mr-3" />
                      <CustomText color="secondary" size="small">
                        {timeLabel || "-"}
                      </CustomText>
                    </View>
                    <View className="flex-row items-center">
                      <View className="h-2 w-2 rounded-full bg-success mr-3" />
                      <CustomText color="secondary" size="small">
                        {t("schedules.customer", { defaultValue: "Cliente" })} {item.customer?.name}
                      </CustomText>
                    </View>
                    {item.customer?.address && (
                      <View className="flex-row items-center">
                        <View className="h-2 w-2 rounded-full bg-gray_medium mr-3" />
                        <CustomText color="gray_medium" size="small" numberOfLines={2}>
                          {item.customer.address}
                        </CustomText>
                      </View>
                    )}
                  </View>

                  <View className="mt-4 flex-row justify-between">
                    {allowGoToDestination ? (
                      <TouchOpacity
                        rounded="lg"
                        itemsCenter
                        onPress={() => handleGoToDestination(item)}
                        otherClasses="px-4 py-2 border border-destination"
                        bgColor="destination"
                      >
                        <CustomText color="secondary" boldness="medium" size="small">
                          {t("schedules.go_destination")}
                        </CustomText>
                      </TouchOpacity>
                    ) : (
                      <View />
                    )}
                    <TouchOpacity
                      rounded="lg"
                      itemsCenter
                      disabled={isScheduleInProgress}
                      onPress={() => handleCancelSchedule(item)}
                      otherClasses={`px-4 py-2 border border-error ${isScheduleInProgress ? "opacity-50" : ""}`}
                    >
                      <CustomText color="error" boldness="medium" size="small">
                        {t("services.cancel.title", { defaultValue: "Cancelar serviço" })}
                      </CustomText>
                    </TouchOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          keyExtractor={(item) => String(item.service_id)}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default ServiceSchedulesBottomSheet;
