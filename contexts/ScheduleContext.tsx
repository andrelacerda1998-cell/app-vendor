import React, {createContext, ReactNode, useCallback, useContext, useEffect, useState} from "react";
import { VendorDataInterface } from "@/types/session";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { useSession } from "./SessionContext";
import {AddressData, ScheduledServiceInterface, WeekdayConfig} from "@/types/schedule";
import { useApi } from "./ApiContext";
import {useTranslation} from "react-i18next";
import {ServiceRequestedInterface} from "@/types/services";

/**
 * Calculate date_label based on scheduled_day
 * Returns "today", "tomorrow", or "week" based on the date
 */
const calculateDateLabel = (scheduledDay: string | undefined): string => {
  if (!scheduledDay) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let scheduledDate: Date | null = null;

  // Try parsing different date formats
  const normalizedDay = scheduledDay.trim();

  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(normalizedDay)) {
    const [year, month, day] = normalizedDay.split(/[-T]/)[0].split('-').map(Number);
    scheduledDate = new Date(year, month - 1, day);
  }
  // DD/MM/YYYY format
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalizedDay)) {
    const [day, month, year] = normalizedDay.split('/').map(Number);
    scheduledDate = new Date(year, month - 1, day);
  }
  // Try direct parsing as fallback
  else {
    const parsed = new Date(normalizedDay);
    if (!isNaN(parsed.getTime())) {
      scheduledDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }

  if (!scheduledDate || isNaN(scheduledDate.getTime())) return '';

  // Compare dates
  if (scheduledDate.getTime() === today.getTime()) {
    return 'today';
  } else if (scheduledDate.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  } else {
    return 'week';
  }
};

interface ScheduleContextProps {
  scheduledServicesData: ServiceRequestedInterface[] | [];
  setScheduledServicesData: React.Dispatch<React.SetStateAction<ServiceRequestedInterface[] | []>>;
  vendorData: VendorDataInterface | null;
  session: string | null;
  weekdays: WeekdayConfig[] | [];
  setWeekdays: React.Dispatch<React.SetStateAction<WeekdayConfig[]>>;
  address: AddressData | null;
  setAddress: React.Dispatch<React.SetStateAction<AddressData | null>>;
  autoAcceptEnabled: boolean;
  setAutoAcceptEnabled: React.Dispatch<React.SetStateAction<boolean>>
  pendingScheduleServices: ScheduledServiceInterface[] | [];
  setPendingScheduleServices: React.Dispatch<React.SetStateAction<ScheduledServiceInterface[] | []>>;
  fetchPendingScheduledService: (scheduleId: string) => void;
  fetchScheduledServices: (scheduledId: string) => void;
  getScheduleSettings: () => void;
  getScheduledServices: (vendorData: VendorDataInterface) => Promise<ServiceRequestedInterface[] | undefined>;
  getPendingScheduleService: (vendorData: VendorDataInterface) => Promise<ScheduledServiceInterface[] | undefined>;
  getFirstPendingSchedule: () => ScheduledServiceInterface | null;
}

const ScheduleContext = createContext<ScheduleContextProps>({
  scheduledServicesData: [],
  setScheduledServicesData: () => {},
  vendorData: null,
  session: null,
  weekdays: [],
  setWeekdays: () => {},
  address: null,
  setAddress: () => {},
  autoAcceptEnabled: false,
  setAutoAcceptEnabled: () => {},
  pendingScheduleServices: [],
  setPendingScheduleServices: () => {},
  fetchPendingScheduledService: () => {},
  fetchScheduledServices: () => {},
  getScheduleSettings: () => {},
  getScheduledServices: async () => { return []; },
  getPendingScheduleService: async () => { return []; },
  getFirstPendingSchedule: () => null,
})

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scheduledServicesData, setScheduledServicesData] = useState<ServiceRequestedInterface[] | []>([]);
  const { session, vendorData } = useSession();
  const { api } = useApi();
  const { t } = useTranslation();
  const [weekdays, setWeekdays] = useState<WeekdayConfig[]>([]);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);
  const [pendingScheduleServices, setPendingScheduleServices] = useState<ScheduledServiceInterface[] | []>([]);

  const getScheduledServices = async (vendorData: VendorDataInterface) => {
    if (!vendorData) {
      return;
    }

    try {
      const schedulesServices = await api.get(API_ROUTES.VENDOR_GET_SCHEDULES).then((response) => {
        const { data } = response.data;

        return data.map((schedule: any) => {
          const scheduledDay = schedule.scheduled_day ?? schedule.schedule?.scheduled_day ?? '';
          const rawDateLabel = schedule.date_label ?? schedule.schedule?.date_label ?? '';
          // Use API date_label if valid, otherwise calculate from scheduled_day
          const dateLabel = ['today', 'tomorrow', 'week'].includes(rawDateLabel)
            ? rawDateLabel
            : calculateDateLabel(scheduledDay);

          return {
            customer: {
              id: schedule.customer.id,
              name: schedule.customer.name,
              address: schedule.address.name,
            },
            amount_for_vendor: schedule.amount_for_vendor ?? schedule.amount ?? null,
            schedule: {
              scheduled_day: scheduledDay,
              date_label: dateLabel,
              scheduled_time: {
                start: schedule.scheduled_time_start ?? schedule.schedule?.scheduled_time_start ?? '',
                end: schedule.scheduled_time_end ?? schedule.schedule?.scheduled_time_end ?? '',
              },
            },
            service_type: {
              id: schedule.service_type.id,
              name: schedule.service_type.name,
            },
            service_id: schedule.service_id ?? schedule.id,
            schedule_id: schedule.schedule_id,
            created_at: schedule.created_timestamp,
            server_time: schedule.server_time,
          };
      });
      });

      setScheduledServicesData(schedulesServices);

    } catch (error: any) {
      console.error(error);

      return [];
    }
  };

  const getScheduleSettings = () => {
      if (!vendorData) return;

      try {
        api.get(API_ROUTES.VENDOR_GET_SCHEDULE_SETTINGS(vendorData.user_id)).then(res => {
          const data = res.data.data;

          const formatTime = (t: string | null | undefined) => {
            return typeof t === "string" && t.length >= 5 ? t.slice(0, 5) : "08:00";
          }

          const weekdaysData: WeekdayConfig[] = data.map((day: any) => {
            return {
              key: day.schedule_day.day_name,
              label: t(`schedules.days.${day.schedule_day.day_name}`),
              enabled: !!Number(day.is_enabled),
              start: formatTime(day.time_start),
              end: formatTime(day.time_end)
            }
          });

          if (data[0]?.vendor?.addresses[0]) {
            const addressData: AddressData = {
              street: data[0].vendor.addresses[0].street_name,
              number: data[0].vendor.addresses[0].street_number,
              city: data[0].vendor.addresses[0].city,
              postalCode: data[0].vendor.addresses[0].postal_code,
            };
            setAddress(addressData);
          }

          setWeekdays(weekdaysData);
          setAutoAcceptEnabled(!!Number(data[0].auto_accept));
        }).catch((err: any) => {
          console.error("Error fetching schedule settings:", err);
        });
      } catch (err: any) {
        console.error("Error in getScheduleSettings:", err);
      }
  }

  const getPendingScheduleService = async (vendorData: VendorDataInterface) => {
    try {
      const pendingSchedules = await api.get(API_ROUTES.VENDOR_GET_PENDING_SCHEDULE_SERVICE).then((response) => {
        const { data } = response.data;

        return data.map((schedule: any) => {
          // Handle service_type.name as either string or object
          const serviceTypeName = schedule.service_type?.name;
          let ptPTName = '';
          let enUSName = '';

          if (typeof serviceTypeName === 'string') {
            ptPTName = serviceTypeName;
          } else if (serviceTypeName && typeof serviceTypeName === 'object') {
            ptPTName = serviceTypeName['pt-pt'] || serviceTypeName['pt_PT'] || serviceTypeName.pt_PT || '';
            enUSName = serviceTypeName['en-us'] || serviceTypeName['en_US'] || serviceTypeName.en_US || '';
          }

          const resolvedServiceId = Number(
            schedule.service_id
              ?? schedule.service?.id
              ?? schedule.service?.service_id
              ?? 0,
          );

          const scheduledDay = schedule.scheduled_day ?? schedule.schedule?.scheduled_day ?? '';
          const rawDateLabel = schedule.date_label ?? schedule.schedule?.date_label ?? '';
          const dateLabel = ['today', 'tomorrow', 'week'].includes(rawDateLabel)
            ? rawDateLabel
            : calculateDateLabel(scheduledDay);

          return {
            id: schedule.id,
            vendor_id: schedule.vendor_id,
            customer_id: schedule.customer_id,
            scheduled_day: scheduledDay,
            name: schedule.customer?.name || '',
            scheduled_time: {
              start: schedule.scheduled_time_start ?? schedule.schedule?.scheduled_time_start ?? '',
              end: schedule.scheduled_time_end ?? schedule.schedule?.scheduled_time_end ?? '',
            },
            service_type: {
              id: schedule.service_type?.id,
              name: {
                en_US: enUSName,
                pt_PT: ptPTName,
              },
            },
            service_id: resolvedServiceId,
            customer_address: schedule.customer?.addresses?.[0]?.address_name || '',
            date_label: dateLabel,
            created_at: schedule.created_at,
          };
        });
      });

      setPendingScheduleServices(pendingSchedules);
      return pendingSchedules;

    } catch (error: any) {
      console.error(error);

      return [];
    }
  }

  const fetchPendingScheduledService = useCallback((scheduleId: string) => {
    if (!vendorData) return;

    console.log('[ScheduleContext] fetchPendingScheduledService called with scheduleId:', scheduleId);
    console.log('[ScheduleContext] API URL:', API_ROUTES.VENDOR_GET_SCHEDULED_DETAILS(scheduleId));

    api.get(API_ROUTES.VENDOR_GET_SCHEDULED_DETAILS(scheduleId)).then(res => {
      console.log('[ScheduleContext] API response success for scheduleId:', scheduleId);
      const data = res.data.data;
      console.log('[ScheduleContext] fetchPendingScheduledService API response:', {
        scheduleId,
        service_id: data.service_id,
        service: data.service,
        fullData: data,
      });

      // Handle service_type.name as either string or object
      const serviceTypeName = data.service_type?.name;
      let ptPTName = '';
      let enUSName = '';

      if (typeof serviceTypeName === 'string') {
        ptPTName = serviceTypeName;
      } else if (serviceTypeName && typeof serviceTypeName === 'object') {
        ptPTName = serviceTypeName['pt-pt'] || serviceTypeName['pt_PT'] || serviceTypeName.pt_PT || '';
        enUSName = serviceTypeName['en-us'] || serviceTypeName['en_US'] || serviceTypeName.en_US || '';
      }

      const resolvedServiceIdRaw = data.service_id
        ?? data.service?.id
        ?? data.service?.service_id;
      const resolvedServiceId = resolvedServiceIdRaw
        ? Number(resolvedServiceIdRaw)
        : undefined;

      const scheduledDay = data.scheduled_day ?? data.schedule?.scheduled_day ?? '';
      const rawDateLabel = data.date_label ?? data.schedule?.date_label ?? '';
      const dateLabel = ['today', 'tomorrow', 'week'].includes(rawDateLabel)
        ? rawDateLabel
        : calculateDateLabel(scheduledDay);

      const pendingSchedule: ScheduledServiceInterface = {
        id: Number(scheduleId), // Use the scheduleId from the URL param to ensure matching
        vendor_id: data.vendor_id,
        customer_id: data.customer_id,
        scheduled_day: scheduledDay,
        name: data.customer_name,
        scheduled_time: {
          start: data.scheduled_time_start ?? data.schedule?.scheduled_time_start ?? '',
          end: data.scheduled_time_end ?? data.schedule?.scheduled_time_end ?? '',
        },
        service_type: {
          id: data.service_type?.id,
          name: {
            'en_US': enUSName,
            'pt_PT': ptPTName,
          },
        },
        service_id: resolvedServiceId ?? 0,
        customer_address: data.customer_address || data.address?.name || '',
        date_label: dateLabel,
        created_at: data.created_timestamp ?? data.created_at,
      };

      setPendingScheduleServices((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const existingIndex = safePrev.findIndex(
          (item) => String(item.id) === String(pendingSchedule.id),
        );
        if (existingIndex >= 0) {
          return safePrev.map((item, index) => {
            if (index !== existingIndex) return item;
            return {
              ...pendingSchedule,
              service_id: resolvedServiceId ?? item.service_id,
            };
          });
        }
        return [pendingSchedule, ...safePrev];
      });
    }).catch((error) => {
      console.log('[ScheduleContext] API error for scheduleId:', scheduleId);
      console.log('[ScheduleContext] API error message:', error.message);
      console.log('[ScheduleContext] API error response:', error.response?.data);
    });
  }, [api, vendorData]);

  // Method built to get fetch scheduled service using websockets where we will get from the specific schedule id
  const fetchScheduledServices = (scheduledId: string) => {
    if (!vendorData) return;

    api.get(API_ROUTES.VENDOR_GET_SCHEDULED_DETAILS(scheduledId)).then(res => {
      const data = res.data.data;

      const scheduledDay = data.scheduled_day ?? data.schedule?.scheduled_day ?? '';
      const rawDateLabel = data.date_label ?? data.schedule?.date_label ?? '';
      // Use API date_label if valid, otherwise calculate from scheduled_day
      const dateLabel = ['today', 'tomorrow', 'week'].includes(rawDateLabel)
        ? rawDateLabel
        : calculateDateLabel(scheduledDay);

      const schedule: ServiceRequestedInterface = {
        customer: {
          id: data.customer.id,
          name: data.customer.name,
          address: data.address.name,
        },
        amount_for_vendor: data.amount_for_vendor ?? data.amount ?? null,
        schedule: {
          scheduled_day: scheduledDay,
          date_label: dateLabel,
          scheduled_time: {
            start: data.scheduled_time_start ?? data.schedule?.scheduled_time_start ?? '',
            end: data.scheduled_time_end ?? data.schedule?.scheduled_time_end ?? '',
          },
        },
        service_type: {
          id: data.service_type.id,
          name: data.service_type.name,
        },
        service_id: data.service_id ?? data.id,
        created_at: data.created_timestamp,
        server_time: data.server_time,
        schedule_id: Number(scheduledId),
      };

      setScheduledServicesData((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const existingIndex = safePrev.findIndex(
          (item) => item.service_id === schedule.service_id,
        );

        if (existingIndex >= 0) {
          return safePrev.map((item, index) =>
            index === existingIndex ? schedule : item,
          );
        }

        return [...safePrev, schedule];
      });
    });
  }

  const getFirstPendingSchedule = useCallback(() => {
    if (!pendingScheduleServices || pendingScheduleServices.length === 0) {
      return null;
    }
    return pendingScheduleServices[0];
  }, [pendingScheduleServices]);

  useEffect(() => {
    if (!session || !vendorData) return;

    getScheduledServices(vendorData).then(() => console.log('Fetched scheduled services'));
    getPendingScheduleService(vendorData).then(() => console.log('Fetched pending scheduled service'));
  }, [session, vendorData]);

  return (
    <ScheduleContext.Provider
      value={{
        scheduledServicesData,
        session,
        vendorData,
        weekdays,
        setWeekdays,
        address,
        setAddress,
        autoAcceptEnabled,
        setAutoAcceptEnabled,
        pendingScheduleServices,
        setPendingScheduleServices,
        setScheduledServicesData,
        fetchPendingScheduledService,
        fetchScheduledServices,
        getScheduleSettings,
        getScheduledServices,
        getPendingScheduleService,
        getFirstPendingSchedule,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  const value = useContext(ScheduleContext);
  if (!value) {
    throw new Error('useSchedule must be wrapped in a <ScheduleProvider />');
  }

  return value;
}
