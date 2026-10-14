import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
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
import { deveAnunciarServicoConfirmado } from "@/utils/servicoConfirmado";
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
  // Nunca fundir serviços diferentes: um fallback de outro id iria ressuscitar
  // campos (morada, valor) do serviço errado.
  if (
    fallback &&
    (fallback as any)?.id != null &&
    (service as any)?.id != null &&
    String((fallback as any).id) !== String((service as any).id)
  ) {
    fallback = null;
  }

  const fallbackCustomer = fallback?.customer as any;
  const fallbackAddress = fallback?.address as any;
  const fallbackVendor = (fallback as any)?.vendor;

  // Só os campos que o payload novo traz mesmo preenchidos se sobrepõem.
  const definedEntries = Object.fromEntries(
    Object.entries(service as any).filter(([, v]) => v !== undefined && v !== null)
  );

  return {
    // O nível de topo também herda o fallback. Sem isto, os campos que o
    // payload magro dos sockets nem traz (schedule, amount_for_vendor,
    // customer_notes, customer_photos…) eram apagados a cada atualização —
    // a hora e o "Valor a receber" desapareciam do ecrã ao vivo.
    ...((fallback as any) || {}),
    ...definedEntries,
    // `status` e `on_the_way_at` são o que o socket vem mesmo dizer: ganham
    // sempre, mesmo quando o novo valor é null (ex.: estado reposto).
    status: (service as any).status ?? (fallback as any)?.status ?? null,
    on_the_way_at: (service as any).on_the_way_at ?? (fallback as any)?.on_the_way_at ?? null,
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
  /**
   * Marca um serviço como já conhecido nesta sessão: o técnico acabou de o
   * aceitar ele próprio, por isso não é "o cliente escolheu-te e pagou".
   */
  marcarServicoComoConhecido: (id?: number | string | null) => void;
  getPendingService: () => Promise<void>;
  /** Recarrega os pedidos pendentes. A promessa resolve quando acaba e nunca rejeita. */
  getPendingServices: () => Promise<void>;
  /**
   * O ecrã cheio de pedido a chegar (incoming-request) avisa quando abre
   * (true) e quando fecha (false). Enquanto houver algum aberto, o arranque
   * não abre a proposta antiga por cima dele (ver getPendingService).
   */
  marcarEcraDePedido: (aberto: boolean) => void;
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
  const { fetchAndSaveUserData, getWalletInfo, session } = useSession();
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

  // Serviços abertos que este técnico já conhecia nesta sessão (o que estava
  // em curso ao abrir a app e os que ele próprio aceitou) e se a primeira carga
  // já aconteceu. Ver utils/servicoConfirmado.
  //
  // Estavam num ref posto a true na primeira renderização — antes de a app ir
  // buscar o serviço aberto. Com isso o aviso disparava sempre que a app abria
  // com um serviço em curso, e também quando o técnico aceitava um pedido
  // direto (o aviso de "aceite" era substituído e o ecrã saltava para o estado).
  const servicosConhecidosRef = useRef<Set<string>>(new Set());
  const primeiraCargaFeitaRef = useRef(false);

  const marcarServicoComoConhecido = useCallback((id?: number | string | null) => {
    if (id != null) servicosConhecidosRef.current.add(String(id));
  }, []);

  // Quantos ecrãs cheios de pedido estão abertos (a notificação faz `push`,
  // por isso pode haver dois empilhados). Num ref e não em estado: quem o lê é
  // o setTimeout do getPendingService, que corre com o estado de quando a app
  // voltou ao primeiro plano, antes de o ecrã abrir.
  const ecrasDePedidoAbertosRef = useRef(0);

  const marcarEcraDePedido = useCallback((aberto: boolean) => {
    ecrasDePedidoAbertosRef.current = Math.max(0, ecrasDePedidoAbertosRef.current + (aberto ? 1 : -1));
  }, []);

  // Outra sessão (sair e entrar, ou outra conta): recomeça do zero.
  useEffect(() => {
    servicosConhecidosRef.current = new Set();
    primeiraCargaFeitaRef.current = false;
  }, [session]);

  const getOpenService = async () => {
    const response = await api.get(API_ROUTES.VENDOR_GET_OPEN_SERVICES);
    if (openService && !response.data.data.service) {
      router.dismissTo('/(app)/(tabs)/home');
      handleServiceStatusChange();
      fetchAndSaveUserData();
      getWalletInfo();
    }
    const service = response.data.data.service || null;
    // A primeira carga da sessão é o ponto de partida: um serviço que já estava
    // em curso ao abrir a app não é novidade e não se anuncia como confirmado.
    if (!primeiraCargaFeitaRef.current) {
      marcarServicoComoConhecido(service?.id);
      primeiraCargaFeitaRef.current = true;
    }
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
        // Um toque na notificação de pedido traz a app ao primeiro plano (o que
        // corre este arranque) e abre logo o ecrã cheio do pedido. Abrir aqui a
        // proposta deixava dois ecrãs para o mesmo pedido, um por cima do outro.
        if (ecrasDePedidoAbertosRef.current > 0) return;
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
          // Duração real, com as unidades pedidas. Vinha no payload e era
          // descartada aqui: o cartão mostrava o tempo de uma só unidade.
          duration_minutes: service.duration_minutes ?? null,
          server_time: service.server_time ?? undefined,
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
    // Liga/desliga o activeService (usado nas notificações).
    setActiveService(!!openService);

    // Momento "serviço confirmado": o cliente escolheu este técnico e PAGOU, e
    // só aí o serviço passa a ser o openService (Accepted). O técnico tinha
    // apenas dito que tinha disponibilidade e voltado à Home — nada o chamava
    // quando o pagamento confirmava (sem APNs não há push). Levamo-lo ao ecrã de
    // execução, onde tem "Estou a caminho" (abre Waze/Google/Apple Maps),
    // "Cheguei" e "Concluir", e deixamos um realce de confirmação.
    //
    // Quando avisar está em utils/servicoConfirmado: nunca pelo serviço que já
    // estava em curso ao abrir a app, nem pelo que o técnico acabou de aceitar,
    // nem duas vezes pelo mesmo.
    const anunciar = deveAnunciarServicoConfirmado(
      openService,
      servicosConhecidosRef.current,
      primeiraCargaFeitaRef.current,
    );
    if (openService?.id != null && primeiraCargaFeitaRef.current) {
      marcarServicoComoConhecido(openService.id);
    }

    if (anunciar && openService) {
      openDialog({
        title: t('services.service.confirmed.title', { defaultValue: 'Serviço confirmado!' }),
        subtitle: t('services.service.confirmed.subtitle', {
          defaultValue: 'O cliente confirmou e pagou. Siga para o local quando estiver pronto.',
        }),
        closeAfterMSeconds: 2500,
        closeOnClickOutside: true,
      });
      router.navigate(`/(app)/(services)/(open)/status/${openService.id}`);
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
        marcarServicoComoConhecido,
        marcarEcraDePedido,
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
