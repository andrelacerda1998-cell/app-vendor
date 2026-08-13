import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useApi } from "./ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import {
  OpenServiceInterface,
  OperationArea,
  ServiceInterface,
  ServiceRequestedInterface,
  ServiceStatus
} from "@/types/services";
import { useSession } from "./SessionContext";
import { router } from "expo-router";
import { useDialog } from "./DialogContext";
import { useTranslation } from "react-i18next";
import XIcon from "@/assets/icons/x";
import { Colors } from "@/constants/Colors";

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const pickText = (...values: Array<string | null | undefined>) =>
  values.find((value) => hasText(value));

const pickValue = <T,>(...values: Array<T | null | undefined>) =>
  values.find((value) => value !== undefined && value !== null);

const mergeOpenServiceData = (service: OpenServiceInterface, fallback?: Partial<ServiceInterface> | Partial<OpenServiceInterface> | null): OpenServiceInterface => {
  const fallbackCustomer = fallback?.customer as any;
  const fallbackAddress = fallback?.address as any;
  const fallbackVendor = (fallback as any)?.vendor;

  return {
    ...service,
    customer: {
      ...(fallbackCustomer || {}),
      ...(service.customer || {}),
      name: pickText(service.customer?.name, fallbackCustomer?.name) ?? null,
      avatar: pickValue(service.customer?.avatar, fallbackCustomer?.avatar) ?? null,
      email: pickText(service.customer?.email, fallbackCustomer?.email) ?? null,
      phone: pickText((service.customer as any)?.phone, fallbackCustomer?.phone) ?? null,
    } as any,
    address: {
      ...(fallbackAddress || {}),
      ...(service.address || {}),
      name: pickText(service.address?.name, fallbackAddress?.name) ?? null,
      address: pickText((service.address as any)?.address, fallbackAddress?.address) ?? null,
      street_name: pickText(service.address?.street_name, fallbackAddress?.street_name) ?? null,
      postal_code: pickText((service.address as any)?.postal_code, fallbackAddress?.postal_code) ?? null,
      city: pickText(service.address?.city, fallbackAddress?.city) ?? null,
      country: pickText((service.address as any)?.country, fallbackAddress?.country) ?? null,
      additional_info: pickText(service.address?.additional_info, fallbackAddress?.additional_info) ?? null,
      latitude: pickValue(service.address?.latitude, fallbackAddress?.latitude) ?? null,
      longitude: pickValue(service.address?.longitude, fallbackAddress?.longitude) ?? null,
    } as any,
    vendor: {
      ...(fallbackVendor || {}),
      ...(service.vendor || {}),
      location: {
        ...(fallbackVendor?.location || {}),
        ...(service.vendor?.location || {}),
        latitude: pickValue(service.vendor?.location?.latitude, fallbackVendor?.location?.latitude) ?? null,
        longitude: pickValue(service.vendor?.location?.longitude, fallbackVendor?.location?.longitude) ?? null,
      },
    } as any,
  };
};

const hasOpenServiceDisplayData = (service?: Partial<OpenServiceInterface> | null) => {
  if (!service) return false;

  return Boolean(
    hasText(service.customer?.name) ||
    hasText(service.address?.name) ||
    hasText((service.address as any)?.address) ||
    hasText(service.address?.street_name)
  );
};

interface ServiceContextProps {
  operationAreas: OperationArea[] | null;
  setOperationAreas: (operationAreas: OperationArea[] | null) => void;
  getOperationAreas: () => Promise<void>;
  myOperationAreas: OperationArea[] | null;
  setMyOperationAreas: (operationAreas: OperationArea[] | null) => void;
  openService: OpenServiceInterface | null;
  setOpenService: (service: OpenServiceInterface | null) => void;
  pendingService: ServiceInterface | null;
  setPendingService: (service: ServiceInterface | null) => void;
  historyServices: ServiceInterface[];
  setHistoryServices: React.Dispatch<React.SetStateAction<ServiceInterface[]>>;
  getOpenService: () => Promise<void>;
  getPendingService: () => Promise<void>;
  getPendingServices: () => void;
  /**
   * Estado da última ida buscar os pedidos pendentes. É o ecrã de receita: uma
   * falha de rede não pode aparecer como "não tens pedidos". Continua a NÃO
   * rejeitar (há muitos chamadores que ignoram a promise) — lê-se por aqui.
   */
  pendingServicesLoading: boolean;
  pendingServicesFailed: boolean;
  pendingServices: ServiceRequestedInterface[] | [];
  setPendingServices: React.Dispatch<React.SetStateAction<ServiceRequestedInterface[] | []>>;

  getHistoryServices: (offset?: number) => void;
  loadingServicesHistory: boolean;
  haveMoreServicesHistory: boolean;
  activeService: boolean;
  setActiveService: (status: boolean) => void;
  unreadMessages: number;
  setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
  incrementUnreadMessages: () => void;
  clearUnreadMessages: () => void;
}

const ServiceContext = createContext<ServiceContextProps | undefined>(undefined);

export const ServiceProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { fetchAndSaveUserData, getWalletInfo } = useSession();
  const { openDialog } = useDialog();
  const [operationAreas, setOperationAreas] = useState<OperationArea[] | null>(null);
  const [myOperationAreas, setMyOperationAreas] = useState<OperationArea[] | null>(null);
  const [openService, setOpenServiceState] = useState<OpenServiceInterface | null>(null);
  const [pendingService, setPendingService] = useState<ServiceInterface | null>(null);
  const [pendingServices, setPendingServices] = useState<ServiceRequestedInterface[] | []>([]);
  const [pendingServicesLoading, setPendingServicesLoading] = useState(true);
  const [pendingServicesFailed, setPendingServicesFailed] = useState(false);
  const [historyServices, setHistoryServices] = useState<ServiceInterface[]>([]);

  const [loadingServicesHistory, setLoadingServicesHistory] = useState(true);
  const [haveMoreServicesHistory, setHaveMoreServicesHistory] = useState(true);
  const [activeService, setActiveService] = useState<boolean>(false);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  const incrementUnreadMessages = useCallback(() => {
    setUnreadMessages(prev => prev + 1);
  }, []);

  const clearUnreadMessages = useCallback(() => {
    setUnreadMessages(0);
  }, []);

  const setOpenService = useCallback((service: OpenServiceInterface | null) => {
    if (!service) {
      setOpenServiceState(null);
      return;
    }

    setOpenServiceState((currentOpenService) => {
      const mergedWithCurrent = mergeOpenServiceData(service, currentOpenService);
      return mergeOpenServiceData(mergedWithCurrent, pendingService);
    });
  }, [pendingService]);

  const getOperationAreas = useCallback(async () => {
    try {
      const response = await api.get(API_ROUTES.VENDOR_GET_OPERATION_AREAS);
      const { operation_areas } = response.data.data;

      setOperationAreas(operation_areas);
      setMyOperationAreas(operation_areas.filter((area: OperationArea) => (area?.services_types_subscribed?.length || 0) > 0));
    } catch (error) {
      console.error(error);
    }
  }, [api]);

  const getOpenService = async () => {
    const response = await api.get(API_ROUTES.VENDOR_GET_OPEN_SERVICES);
    if (openService && !response.data.data.service) {
      router.dismissTo('/(app)/(tabs)/home');
      handleServiceStatusChange();
      fetchAndSaveUserData();
      getWalletInfo();
    }
    const service = response.data.data.service || null;
    setOpenService(service); //uncomment later, this is real data

    if (service?.id && !hasOpenServiceDisplayData(service)) {
      api.get(API_ROUTES.GET_SERVICE_DETAILS(`${service.id}`))
        .then((detailsResponse) => {
          const detailedService = detailsResponse.data?.data?.service;
          if (detailedService) {
            setOpenService(detailedService);
          }
        })
        .catch(() => {});
    }
  }

  const handleServiceStatusChange = () => {
    if (!openService) return;
    api.get(API_ROUTES.GET_SERVICE_DETAILS(`${openService.id}`))
      .then((response) => {
        const service = response.data.data.service;
        if (service.status === ServiceStatus.CLOSED) {
          router.navigate({
            pathname: '/(app)/(bottom-sheets)/(services)/rate/[serviceId]',
            params: {
              serviceId: openService.id,
              service: JSON.stringify(openService),
            },
          })
        } else if (service.status === ServiceStatus.REFUSED) {
          openDialog({
            title: t('services.service.channel.refused.title'),
            subtitle: t('services.service.channel.refused.subtitle'),
            closeAfterMSeconds: 3000,
            closeOnClickOutside: true,
          })
        } else if (service.status === ServiceStatus.CANCELED) {
          openDialog({
            title: t('services.wait_accept.canceled.title'),
            subtitle: t('services.wait_accept.canceled.subtitle'),
            closeAfterMSeconds: 3000,
            closeOnClickOutside: true,
          })
        }
        // else if (service.status === ServiceStatus.ACCEPTED) {
        //   setOpenService(service);
        //   setStatus("success");
        //   setServicePendingAcceptance(null);
        // }
      })
      // .catch((error) => {
      //   console.error(error);
      // })
  }

  const getPendingService = async () => {
    const response = await api.get(API_ROUTES.VENDOR_GET_PENDING_SERVICE);
    const service = response.data.data.service;


    if (openService && service) {
      router.dismissTo('/(app)/(tabs)/home');
    }

    if (!pendingService && service) {
      const scheduleId = service.schedule_id ?? service.schedule?.id;
      setTimeout(() => {
        if (scheduleId) {
          router.navigate({
            pathname: '/(app)/(bottom-sheets)/(services)/schedule-proposal/[scheduleId]',
            params: {
              scheduleId: String(scheduleId),
              serviceId: String(service.id),
            },
          });
        } else {
          router.navigate(`/(app)/(bottom-sheets)/(services)/proposal/${service.id}`);
        }
      }, 500);
    } else {
    }

    setPendingService(service || null);
  }

  const getPendingServices = () => {
    setPendingServicesLoading(true);
    return api.get(API_ROUTES.VENDOR_GET_PENDING_ALL_SERVICES).then((response) => {
      const { services } = response.data.data;

      const pendingServices: ServiceRequestedInterface[] = services.map((service: any) => {
        return {
          customer: {
            id: service.customer.id,
            name: service.customer.name,
            address: service.address.name,
          },
          schedule: {
            scheduled_day: service.schedule?.scheduled_day,
            date_label: '',
            scheduled_time: {
              start: service.schedule?.scheduled_time_start,
              end: service.schedule?.scheduled_time_end,
            },
          },
          service_type: {
            id: service.service_type.id,
            name: service.service_type.name,
            // Duração estimada em minutos; ausente em payloads antigos.
            time: service.service_type.time ?? null,
          },
          // Morada completa + observações do cliente: o que o profissional
          // precisa para decidir. Ausentes => null (o cartão omite).
          address_details: service.address_details ?? null,
          customer_notes: service.customer_notes ?? null,
          // Fotos do problema. Payloads antigos não as trazem => [].
          customer_photos: Array.isArray(service.customer_photos) ? service.customer_photos : [],
          amount_for_vendor: service.amount_for_vendor,
          service_id: service.id,
          schedule_id: service.schedule?.id ?? service.schedule_id ?? null,
          created_at: service.created_timestamp,
          // `is_immediate` só existe no payload de formatDataForVendor; na lista de
          // pendentes derivamos com a mesma regra do backend (imediato == sem agendamento).
          is_immediate: typeof service.is_immediate === 'boolean'
            ? service.is_immediate
            : !service.schedule,
          // Distância em quilómetros (ServiceRequestedData::distance).
          distance: service.distance ?? null,
        }
      });

      setPendingServices(pendingServices);
      setPendingServicesFailed(false);
    }).catch((error) => {
      console.error('[ServiceContext] Failed to get pending services: ', error.message);
      setPendingServicesFailed(true);
    }).finally(() => {
      setPendingServicesLoading(false);
    })
  }

  const getHistoryServices = (offset?: number) => {
    if (!loadingServicesHistory) setLoadingServicesHistory(true);
    api.post(API_ROUTES.POST_SERVICES_HISTORY, {
      offset: offset !== undefined ? offset : historyServices.length,
    })
      .then((response) => {
        const { data } = response.data;

        setHaveMoreServicesHistory(!!data.have_more);

        setHistoryServices(data.services)
      })
      .catch((error) => {
        if (error?.response?.status !== 401) {
          openDialog({
            icon: <XIcon color={Colors.primary} />,
            title: t('errors.service_history.title'),
            subtitle: t('errors.service_history.subtitle'),
            closeAfterMSeconds: 2000,
            closeOnClickOutside: true,
          });
        }
      })
      .finally(() => {
        setLoadingServicesHistory(false);
      });
  }

  useEffect(()=> {
    if(!openService){
      //no open service, this sets the activeService to false, to use its value in the notifications
      setActiveService(false);

    }else{
      //there is an open service, this sets the activeService to true, to use its value in the notifications
      setActiveService(true);
    }

  }, [openService]);

  return (
    <ServiceContext.Provider
      value={{
        operationAreas,
        setOperationAreas,
        getOperationAreas,
        myOperationAreas,
        setMyOperationAreas,
        openService,
        setOpenService,
        pendingService,
        setPendingService,
        historyServices,
        setHistoryServices,
        getOpenService,
        getPendingService,
        getPendingServices,
        pendingServicesLoading,
        pendingServicesFailed,
        pendingServices,
        setPendingServices,

        getHistoryServices,
        loadingServicesHistory,
        haveMoreServicesHistory,
        activeService,
        setActiveService,
        unreadMessages,
        setUnreadMessages,
        incrementUnreadMessages,
        clearUnreadMessages,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useService = () => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
};
