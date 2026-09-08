import { FlatList, RefreshControl, SafeAreaView, View, Vibration, TouchableOpacity } from "react-native";
import TouchOpacity from "@/components/TouchOpacity";
import {router} from "expo-router";
import ArrowIcon from "@/assets/icons/arrow";
import {Colors} from "@/constants/Colors";
import {CustomText} from "@/components/CustomText";
import ServiceCard from "@/components/app/ServiceCard";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import AcceptReject, {AcceptRejectType} from "@/components/Buttons/AcceptReject";
import {API_ROUTES} from "@/constants/ApiRoutes";
import {useApi} from "@/contexts/ApiContext";
import {useSession} from '@/contexts/SessionContext';
import {
  URGENT_THRESHOLD_MS,
  remainingFrom,
  remainingProgress,
  requestExpiresAt,
  requestWindowMs,
} from "@/utils/requestTiming";
import {useService} from "@/contexts/ServiceContext";
import {ServiceRequestedInterface} from "@/types/services";
import {EmptyState, ErrorState, SkeletonList} from "@/components/ui";
import {useIsOnline} from "@/hooks/useIsOnline";
import {renderMoney} from "@/utils/money";
import useRequestActions from "@/hooks/useRequestActions";

interface FilterOptionObject {
  id: number;
  label: string;
}

type FilterOption = "all" | FilterOptionObject;

const Requests = () => {
  const { t } = useTranslation();
  const {  vendorData }  = useSession();
  const { api } = useApi();
  const {
    operationAreas,
    pendingServices,
    getPendingServices,
    pendingServicesLoading,
    pendingServicesFailed,
  } = useService();
  const isOnline = useIsOnline();

  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("all");
  const [refreshingList, setRefreshingList] = useState(false);

  /**
   * Aceitar/recusar via hook partilhado (o mesmo do ecrã full-screen).
   * Antes: um estado `selected` disparava um useEffect que fazia o POST —
   * ação-por-efeito, com corrida entre toques duplos e reset do estado.
   * Agora o toque chama o handler diretamente, com guarda `submitting`.
   */
  const { accept, refuse, submitting } = useRequestActions();

  const onDecision = ({ id, service_id, accepted }: AcceptRejectType) => {
    if (submitting || !service_id) return;
    if (accepted) accept({ scheduleId: id, serviceId: service_id });
    else refuse(service_id);
  };

  const refreshList = async () => {
    setRefreshingList(true);
    try { await getPendingServices(); } finally { setRefreshingList(false); }
  };
  const [services, setServices] = useState<ServiceRequestedInterface[]>();
  const [ hoursOfService, setHoursOfService] = useState<any>({});

  //the below state will be used to handle the remaining time to accept service for each item of the services flatlist
  const [expiresMap, setExpiresMap] = useState<Record<string, number>>({});
  const [windowMap, setWindowMap] = useState<Record<string, number>>({});
  const [remainingMap, setRemainingMap] = useState<Record<string, {minutes: number; seconds: number} | null>>({});
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [urgentMap, setUrgentMap] = useState<Record<string, boolean>>({});
  // Guarda os ids já vibrados para não repetir a vibração a cada tick.
  const vibratedRef = useRef<Record<string, boolean>>({});


  const FILTERS = useMemo<FilterOption[]>(() => {
    if (!operationAreas || operationAreas.length === 0) return ["all"];

    return [
      "all",
      ...operationAreas.map((area) => ({
        id: area.id,
        label: area.name,
      })),
    ];
  }, [operationAreas]);

  const changeFilter = (filter: FilterOption) => {
    setSelectedFilter(filter);
  };

  const isStrictNumber = (value: any) => {
    return typeof value === "number" && Number.isFinite(value);
  };

  /**
   * Get the vendors list and the op areas to calculate
   * the service value afterwards - we will need the
   * vendors service price to calculate the whole service value
   *
   */

  const fetchAllOperationHours = async () => {
    try {
      const response = await api.post(API_ROUTES.POST_SEARCH_OPERATION_AREAS, {});
      const { data } = response?.data || {};

      if (data?.services_types && Array.isArray(data.services_types)) {
        const newHours: Record<number, number> = {};

        data.services_types.forEach((service: any) => {
          if (service?.id && isStrictNumber(service?.time)) {
            const hours = Math.round(service.time / 60);
            newHours[service.id] = hours;
          }
        });

        setHoursOfService(newHours);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
       //todo handle error
      }
    }
  };

  //used to calculate the final price of the service
  const handlePrice = (hours: any, price: any) => {
    const numHours = Number(hours);
    const numPrice = Number(price);

    if (
      !numHours ||
      !numPrice ||
      isNaN(numHours) ||
      isNaN(numPrice)
    ) {
      return '—';
    }

    const total = numHours * numPrice;

    return total.toFixed(2);
  };

  useEffect(() => {
    getPendingServices();
  }, []);

  useEffect(() => {
    if (selectedFilter === "all") {
      setServices(pendingServices);
    } else {
      setServices(
        pendingServices.filter((service) => {
          const serviceType = service.service_type;
          if (!serviceType) return false;
          return serviceType.id === (selectedFilter as FilterOptionObject).id;
        }),
      );
    }
  }, [pendingServices, selectedFilter]);

  useEffect(()=> {
    fetchAllOperationHours();
  }, [services]);

  useEffect(() => {
    if (!services) return;

    const newMap: Record<string, number> = {};
    const newWindows: Record<string, number> = {};

    services.forEach(item => {
      if (!item.service_id) return;
      // Imediato -> 60s; agendado -> 20min (paridade com a app Flutter).
      const expiresAt = requestExpiresAt(item);
      if (!expiresAt) return;
      newMap[String(item.service_id)] = expiresAt;
      newWindows[String(item.service_id)] = requestWindowMs(item);
    });

    setExpiresMap(newMap);
    setWindowMap(newWindows);
  }, [services]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const newRemaining: Record<string, {minutes: number; seconds: number} | null> = {};
      const newProgress: Record<string, number> = {};
      const newUrgent: Record<string, boolean> = {};

      Object.entries(expiresMap).forEach(([id, expiresAt]) => {
        if (!expiresAt) return;
        const diff = expiresAt - now;
        newRemaining[id] = remainingFrom(expiresAt, now) ?? null;
        newProgress[id] = remainingProgress(expiresAt, windowMap[id] ?? 0, now);
        newUrgent[id] = diff > 0 && diff <= URGENT_THRESHOLD_MS;

        // Vibração nos últimos 10 segundos (expo-haptics não está instalado).
        if (newUrgent[id] && !vibratedRef.current[id]) {
          vibratedRef.current[id] = true;
          Vibration.vibrate([0, 120, 120, 120]);
        }
        if (diff > URGENT_THRESHOLD_MS) {
          vibratedRef.current[id] = false;
        }
      });

      setRemainingMap(newRemaining);
      setProgressMap(newProgress);
      setUrgentMap(newUrgent);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [expiresMap, windowMap]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <View className="flex-1 p-5" style={{ backgroundColor: Colors.bg }}>
        <View className="flex-row items-center justify-between mb-6">
          <TouchOpacity onPress={() => router.back()} otherClasses="h-10 w-10" itemsCenter>
            <ArrowIcon color={Colors.secondary} position="left" size="40%" />
          </TouchOpacity>
          <CustomText color="secondary" boldness="semiBold" classes="text-xl">
            {t("services.list.header")}
          </CustomText>
          <View className="h-10 w-10" />
        </View>

        {/*<View className="mb-6" style={{ height: 40 }}>
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
                key={filter === "all" ? "all" : `area-${filter.id}`}
                label={
                  filter === "all"
                    ? t("schedules.filters.all")
                    : filter.label
                }
                active={selectedFilter === filter}
                onPress={() => changeFilter(filter)}
              />
            ))}
          </ScrollView>
        </View>*/}

        <FlatList
          data={services}
          extraData={{ hoursOfService }}
          // Pull-to-refresh: sem isto, um pedido que chegasse com o socket
          // perdido só aparecia fechando e reabrindo o ecrã.
          refreshControl={
            <RefreshControl
              refreshing={refreshingList}
              onRefresh={refreshList}
              tintColor={Colors.brand}
            />
          }
          ListEmptyComponent={
            // Ecrã de receita: a lista vazia SÓ pode aparecer depois de sabermos
            // que a chamada correu bem. A carregar -> esqueleto; a falhar ->
            // erro com "Tentar novamente". Nunca um falso "não tens pedidos".
            pendingServicesLoading ? (
              <View className="py-4">
                <SkeletonList rows={3} />
              </View>
            ) : pendingServicesFailed ? (
              <View className="py-4">
                <ErrorState
                  icon={isOnline ? 'alert-circle' : 'wifi-off'}
                  title={t('schedules.requests_error_title')}
                  subtitle={isOnline
                    ? t('schedules.requests_error_subtitle')
                    : t('general.offline_subtitle')}
                  onRetry={() => getPendingServices()}
                />
              </View>
            ) : (
              <View className="py-4">
                <EmptyState
                  icon="inbox"
                  title={t('schedules.requests_empty_title')}
                  subtitle={t('schedules.requests_empty_subtitle')}
                />
              </View>
            )
          }
          renderItem={({item})=> {
            const remaining = remainingMap[String(item?.service_id)];
            const scheduleFor = item.schedule ? `${item.schedule.scheduled_day}` : null;
            // Sem valor conhecido mostra-se "—" em vez de "NaN€"/"0€".
            const priceLabel = renderMoney(item.amount_for_vendor ?? null) || "—";

            return <View className="mb-4">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({
                  pathname: '/(app)/(modals)/incoming-request/[serviceId]',
                  params: { serviceId: String(item.service_id) },
                })}
              >
              <ServiceCard
                item={item}
                scheduleFor={scheduleFor}
                price={priceLabel}
                remainingTime={remaining === undefined ? undefined : remaining}
                progress={progressMap[String(item?.service_id)]}
                urgent={!!urgentMap[String(item?.service_id)]}
                key={item.service_id}
              >
                {remaining === undefined ? null : remaining === null ? (
                  <CustomText color="error" size="small">{t('schedules.times_up')}</CustomText>
                ) : null}
                <AcceptReject
                  id={item.schedule_id}
                  serviceId={item.service_id}
                  setSelected={onDecision}
                  disabled={submitting || remaining === null}
                />
              </ServiceCard>
              </TouchableOpacity>
            </View>
          }}
          keyExtractor={(item) => String(item.service_id)}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </SafeAreaView>
  );
}

export default Requests;
