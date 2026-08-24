import { useCallback, useState } from "react";
import { track, AnalyticsEvent } from '@/utils/analytics';
import { useTranslation } from "react-i18next";
import React from "react";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { useApi } from "@/contexts/ApiContext";
import { useService } from "@/contexts/ServiceContext";
import { useSchedule } from "@/contexts/ScheduleContext";
import { useDialog } from "@/contexts/DialogContext";
import { Colors } from "@/constants/Colors";
import CheckMark from "@/assets/icons/check-mark";

/**
 * Aceitar/recusar um pedido — MESMOS endpoints e MESMA lógica do ecrã
 * `(bottom-sheets)/(services)/requests`, extraídos para poderem ser usados
 * também pelo ecrã full-screen de pedido a chegar.
 */
export const useRequestActions = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { setPendingServices, getPendingServices } = useService();
  const { setPendingScheduleServices, fetchScheduledServices } = useSchedule();
  const { openDialog } = useDialog();

  const [submitting, setSubmitting] = useState(false);

  const showError = useCallback((error: any, context: 'accept' | 'refuse') => {
    const scope = context === 'accept' ? 'errors.service_accept' : 'errors.service_refuse';
    openDialog({
      title: t(`${scope}.title`),
      subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t(`${scope}.subtitle`),
      closeAfterMSeconds: 3000,
      closeOnClickOutside: true,
    });
    getPendingServices();
  }, [openDialog, getPendingServices, t]);

  const showAccepted = useCallback(() => {
    openDialog({
      icon: React.createElement(CheckMark, { color: Colors.primary }),
      title: t("services.service.channel.accepted.title"),
      subtitle: t("services.service.channel.accepted.subtitle"),
      closeAfterMSeconds: 3000,
      closeOnClickOutside: true,
    });
  }, [openDialog, t]);

  /** Recusa — igual para imediato e agendado. */
  const refuse = useCallback(async (serviceId: number | string) => {
    setSubmitting(true);
    try {
      await api.post(API_ROUTES.POST_REFUSE_SERVICE(String(serviceId)));
      track(AnalyticsEvent.REQUEST_REFUSED, { service_id: Number(serviceId) });
      const refusedServiceId = Number(serviceId);
      setPendingServices((prev) => (prev ?? []).filter(s => s.service_id !== refusedServiceId));
      setPendingScheduleServices((prev) => (prev ?? []).filter(s => s.service_id !== refusedServiceId));
      return true;
    } catch (error) {
      showError(error, 'refuse');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [api, setPendingServices, setPendingScheduleServices, showError]);

  /** Aceita: com `scheduleId` usa o endpoint de agendamento, senão o imediato. */
  const accept = useCallback(async (
    { scheduleId, serviceId }: { scheduleId?: number | string | null; serviceId: number | string },
  ) => {
    setSubmitting(true);
    try {
      if (scheduleId) {
        const acceptedScheduleId = Number(scheduleId);
        await api.post(API_ROUTES.VENDOR_ACCEPT_SCHEDULED_SERVICE, { schedule_id: scheduleId });
        track(AnalyticsEvent.REQUEST_ACCEPTED, { schedule_id: Number(scheduleId), scheduled: true });
        setPendingServices((prev) => (prev ?? []).filter(s => s.schedule_id !== acceptedScheduleId));
        setPendingScheduleServices((prev) => (prev ?? []).filter(s => s.id !== acceptedScheduleId));
        fetchScheduledServices(String(scheduleId));
      } else {
        const acceptedServiceId = Number(serviceId);
        await api.post(API_ROUTES.VENDOR_ACCEPT_SERVICE_BY_ID(String(serviceId)));
        track(AnalyticsEvent.REQUEST_ACCEPTED, { service_id: Number(serviceId), scheduled: false });
        setPendingServices((prev) => (prev ?? []).filter(s => s.service_id !== acceptedServiceId));
      }
      showAccepted();
      return true;
    } catch (error) {
      showError(error, 'accept');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [api, fetchScheduledServices, setPendingServices, setPendingScheduleServices, showAccepted, showError]);

  return { accept, refuse, submitting };
};

export default useRequestActions;
