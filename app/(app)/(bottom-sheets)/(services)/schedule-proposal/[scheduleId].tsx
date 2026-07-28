import React, { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/Colors";
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { useDialog } from "@/contexts/DialogContext";
import { useSchedule } from "@/contexts/ScheduleContext";
import { useService } from "@/contexts/ServiceContext";
import DynamicSizingSheet from "@/components/sheets/DynamicSizingSheet";
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import Timer from "@/components/Timer";
import CheckMark from "@/assets/icons/check-mark";
import XIcon from "@/assets/icons/x";

const ACCEPT_WINDOW_SECONDS = 20 * 60;

const JobDetail = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between mt-2">
    <CustomText color="gray_medium" classes="w-[50%]" numberOfLines={1}>
      {label}
    </CustomText>
    <View className="items-end w-[48%]">
      <CustomText color="secondary" numberOfLines={3}>
        {value}
      </CustomText>
    </View>
  </View>
);

const ScheduleProposalBottomSheet = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const scheduleId = Array.isArray(params.scheduleId) ? params.scheduleId[0] : params.scheduleId;
  const socketServiceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { pendingScheduleServices, setPendingScheduleServices, fetchPendingScheduledService, fetchScheduledServices } = useSchedule();
  const { pendingServices, getPendingServices } = useService();
  const [isLoading, setIsLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [didFetchPendingServices, setDidFetchPendingServices] = useState(false);

  useEffect(() => {
    if (scheduleId) {
      fetchPendingScheduledService(String(scheduleId));
    }
  }, [scheduleId, fetchPendingScheduledService]);

  const pendingSchedule = useMemo(() => {
    if (!scheduleId) return null;
    return pendingScheduleServices.find((schedule) => String(schedule.id) === String(scheduleId)) ?? null;
  }, [pendingScheduleServices, scheduleId]);

  const isFetchingData = !pendingSchedule && scheduleId;

  const createdAtMs = useMemo(() => {
    const raw = pendingSchedule?.created_at;
    const num = typeof raw === "string" || typeof raw === "number" ? Number(raw) : NaN;
    if (!Number.isFinite(num)) return Date.now();
    return num < 1e12 ? num * 1000 : num;
  }, [pendingSchedule?.created_at]);

  const scheduleTime = useMemo(() => {
    const start = pendingSchedule?.scheduled_time?.start?.slice(0, 5);
    const end = pendingSchedule?.scheduled_time?.end?.slice(0, 5);
    const range = start && end ? `${start} - ${end}` : start || end || "";
    return [pendingSchedule?.scheduled_day, range].filter(Boolean).join(" ");
  }, [pendingSchedule?.scheduled_day, pendingSchedule?.scheduled_time?.start, pendingSchedule?.scheduled_time?.end]);

  const serviceName =
    pendingSchedule?.service_type?.name?.pt_PT
    || pendingSchedule?.service_type?.name?.en_US
    || t("services.service.no_type");

  const resolvedServiceId = useMemo(() => {
    // Check for valid service_id (not undefined, not null, and > 0)
    if (pendingSchedule?.service_id && pendingSchedule.service_id > 0) {
      return pendingSchedule.service_id;
    }
    if (socketServiceId) {
      const parsed = Number(socketServiceId);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return undefined;
  }, [pendingSchedule?.service_id, socketServiceId]);

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.navigate("/(app)/(tabs)/home");
  };

  const removePendingSchedule = () => {
    if (!scheduleId) return;
    setPendingScheduleServices((prev) => {
      const filtered = (prev ?? []).filter((schedule) => String(schedule.id) !== String(scheduleId));
      return filtered;
    });
  };

  const onAcceptSchedule = () => {
    if (!scheduleId) return;
    setIsLoading(true);
    api.post(API_ROUTES.VENDOR_ACCEPT_SCHEDULED_SERVICE, {
      schedule_id: pendingSchedule?.id ?? scheduleId,
    })
      .then(() => {
        removePendingSchedule();
        getPendingServices();
        // Fetch the accepted schedule to add it to the scheduled services list
        fetchScheduledServices(String(scheduleId));
        openDialog({
          icon: <CheckMark color={Colors.primary} />,
          title: t("services.service.channel.accepted.title"),
          subtitle: t("services.service.channel.accepted.subtitle"),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
        onClose();
      })
      .catch((error: any) => {
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t("errors.service_accept.title"),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t("errors.service_accept.subtitle"),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onRefuseSchedule = () => {
    const serviceRef = resolvedServiceId;

    if (!serviceRef) {
      // Still remove from pending list and close
      removePendingSchedule();
      onClose();
      return;
    }

    setIsLoading(true);
    api.post(API_ROUTES.POST_REFUSE_SERVICE(String(serviceRef)))
      .then(() => {
        removePendingSchedule();
        getPendingServices();
        openDialog({
          title: t("services.service.channel.refused.title"),
          subtitle: t("services.service.channel.refused.subtitle"),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
        onClose();
      })
      .catch((error: any) => {
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t("errors.service_refuse.title"),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t("errors.service_refuse.subtitle"),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleRefuseSchedule = () => {
    openDialog({
      title: t("services.wait_accept.refused.confirmation.title"),
      subtitle: t("services.wait_accept.refused.confirmation.subtitle"),
      cancelButtonText: t("services.wait_accept.refused.confirmation.cancel"),
      successButtonText: t("services.wait_accept.refused.confirmation.confirm"),
      onSuccess() {
        onRefuseSchedule();
      },
    });
  };

  return (
    <DynamicSizingSheet
      type="scrollView"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
      }}
      handleStyle={{
        backgroundColor: Colors.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      handleIndicatorStyle={{
        backgroundColor: Colors.gray_light,
      }}
      backgroundStyle={{
        backgroundColor: Colors.primary,
      }}
      onClose={onClose}
      backdropComponent={() => <View style={{ flex: 1, backgroundColor: "black", opacity: 0.6 }} />}
    >
      <View style={{ backgroundColor: Colors.primary, padding: 20, flex: 1 }}>
        {isFetchingData ? (
          <View className="items-center justify-center flex-1 py-8">
            <ActivityIndicator size="large" color={Colors.support_primary} />
            <CustomText color="gray_medium" className="text-center mt-4">
              {t("general.loading")}
            </CustomText>
          </View>
        ) : (
          <>
            <View className="mx-auto">
              <CustomText size="title" color="secondary" classes="text-center" numberOfLines={1}>
                {t("schedules.new_schedule_of", { defaultValue: "Novo agendamento de" })}
              </CustomText>
              <CustomText size="subtitle" color="support_primary" className="text-center" boldness="medium" numberOfLines={1}>
                {serviceName}
              </CustomText>
              <View className="pt-2">
                <CustomText color="gray_medium" className="text-center" numberOfLines={1}>
                  {t("services.service.proposal.title")}
                </CustomText>
              </View>
            </View>

            <View className="items-center justify-center flex-1 py-4">
              <Timer
                durationSeconds={ACCEPT_WINDOW_SECONDS}
                startedAtMs={createdAtMs}
                onTimeout={() => setDisableButton(true)}
              />
            </View>

            <View className="justify-end items-center space-y-2 py-2">
              <JobDetail
                label={t("schedules.schedule_for", { defaultValue: "Agendado para" })}
                value={scheduleTime || "—"}
              />
              <JobDetail
                label={t("services.service.proposal.location")}
                value={pendingSchedule?.customer_address || "—"}
              />
            </View>
          </>
        )}
      </View>
      <View className="flex-row justify-between p-5">
        <View className="w-[47%]">
          <CustomTouchableOpacity
            size="large"
            type="secondary_outline"
            textColor="secondary"
            textBoldness="semiBold"
            text={t("services.service.proposal.refuse")}
            onPress={handleRefuseSchedule}
            disabled={isLoading || !pendingSchedule || disableButton}
          />
        </View>

        <View className="w-[47%]">
          <CustomTouchableOpacity
            size="large"
            type="support_primary"
            textColor="primary"
            textBoldness="semiBold"
            text={t("services.service.proposal.accept")}
            onPress={onAcceptSchedule}
            disabled={isLoading || !pendingSchedule || disableButton}
          />
        </View>
      </View>
    </DynamicSizingSheet>
  );
};

export default ScheduleProposalBottomSheet;
