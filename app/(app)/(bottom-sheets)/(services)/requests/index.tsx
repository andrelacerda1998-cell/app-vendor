import {FlatList, SafeAreaView, ScrollView, View, Text} from "react-native";
import TouchOpacity from "@/components/TouchOpacity";
import {router} from "expo-router";
import ArrowIcon from "@/assets/icons/arrow";
import {Colors} from "@/constants/Colors";
import {CustomText} from "@/components/CustomText";
import FilterChip from "@/components/app/FilterChip";
import ServiceCard from "@/components/app/ServiceCard";
import React, {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {ScheduledServiceInterface} from "@/types/schedule";
import AcceptReject, {AcceptRejectType} from "@/components/Buttons/AcceptReject";
import {API_ROUTES} from "@/constants/ApiRoutes";
import {useApi} from "@/contexts/ApiContext";
import {useSchedule} from "@/contexts/ScheduleContext";
import {useSession} from '@/contexts/SessionContext';
import {toTimestampMs} from "@/utils";
import {useService} from "@/contexts/ServiceContext";
import {ServiceRequestedInterface} from "@/types/services";
import {useDialog} from "@/contexts/DialogContext";
import CheckMark from "@/assets/icons/check-mark";

interface FilterOptionObject {
  id: number;
  label: string;
}

type FilterOption = "all" | FilterOptionObject;

interface VendorsInterface {
  distance: number,
  id: number,
  name: string,
  // nif: string,
  rate: number,
  rating: number
}

interface VendorsInterface {
  distance: number,
  id: number,
  name: string,
  // nif: string,
  rate: number,
  rating: number
}

const Requests = () => {
  const { t } = useTranslation();
  const {  vendorData }  = useSession();
  const { api } = useApi();
  const { operationAreas, pendingServices, setPendingServices, getPendingServices } = useService();
  const { setPendingScheduleServices, fetchScheduledServices } = useSchedule();
  const { openDialog } = useDialog();

  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("all");
  const [services, setServices] = useState<ServiceRequestedInterface[]>();
  const [selected, setSelected] = useState<AcceptRejectType>({id: null, service_id: null, accepted: false});
  const [ hoursOfService, setHoursOfService] = useState<any>({});

  //the below state will be used to handle the remaining time to accept service for each item of the services flatlist
  const [expiresMap, setExpiresMap] = useState<Record<string, number>>({});
  const [remainingMap, setRemainingMap] = useState<Record<string, {minutes: number; seconds: number} | null>>({});

  useEffect(() => {
    if (!selected.id && !selected.service_id) return;

    // Refuse (works for both immediate and scheduled)
    if (!selected.accepted && selected.service_id) {
      const refusedServiceId = Number(selected.service_id);
      api.post(API_ROUTES.POST_REFUSE_SERVICE(selected.service_id as string)).then(() => {
        setPendingServices((prev) => (prev ?? []).filter(s => s.service_id !== refusedServiceId));
        setPendingScheduleServices((prev) => (prev ?? []).filter(s => s.service_id !== refusedServiceId));
        setSelected({id: null, service_id: null, accepted: false});
      }).catch((error) => {
        console.log('Error refusing service:', error);
        openDialog({
          title: t('errors.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
        getPendingServices();
      });
      return;
    }

    // Accept - scheduled service (has schedule_id)
    if (selected.accepted && selected.id) {
      const acceptedScheduleId = Number(selected.id);
      api.post(API_ROUTES.VENDOR_ACCEPT_SCHEDULED_SERVICE, {
        schedule_id: selected.id
      }).then(() => {
        setPendingServices((prev) => (prev ?? []).filter(s => s.schedule_id !== acceptedScheduleId));
        setPendingScheduleServices((prev) => (prev ?? []).filter(s => s.id !== acceptedScheduleId));
        fetchScheduledServices(String(selected.id));
        setSelected({id: null, service_id: null, accepted: false});
        openDialog({
          icon: <CheckMark color={Colors.primary} />,
          title: t("services.service.channel.accepted.title"),
          subtitle: t("services.service.channel.accepted.subtitle"),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
      }).catch((error) => {
        console.log('Error accepting scheduled service:', error);
        openDialog({
          title: t('errors.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
        getPendingServices();
      });
      return;
    }

    // Accept - immediate service (no schedule_id, only service_id)
    if (selected.accepted && !selected.id && selected.service_id) {
      const acceptedServiceId = Number(selected.service_id);
      api.post(API_ROUTES.VENDOR_ACCEPT_SERVICE_BY_ID(selected.service_id as string)).then(() => {
        setPendingServices((prev) => (prev ?? []).filter(s => s.service_id !== acceptedServiceId));
        setSelected({id: null, service_id: null, accepted: false});
        openDialog({
          icon: <CheckMark color={Colors.primary} />,
          title: t("services.service.channel.accepted.title"),
          subtitle: t("services.service.channel.accepted.subtitle"),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
      }).catch((error) => {
        console.log('Error accepting immediate service:', error);
        openDialog({
          title: t('errors.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
        getPendingServices();
      });
    }
  }, [selected]);

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

    services.forEach(item => {
      if (item.service_id && item.created_at) {
        const createdAtMs = Number(item.created_at) < 1e12
          ? Number(item.created_at) * 1000
          : Number(item.created_at);

        newMap[String(item.service_id)] = createdAtMs + 20 * 60 * 1000; // 20 min
      }
    });

    setExpiresMap(newMap);
  }, [services]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMap(prev => {
        const newRemaining: typeof prev = {};

        Object.entries(expiresMap).forEach(([id, expiresAt]) => {
          if (!expiresAt) {
            console.warn(`expiresAt missing for id=${id}`);
            return;
          }
          const diff = expiresAt - Date.now();
          newRemaining[id] = diff <= 0 ? null : {
            minutes: Math.floor(diff / 1000 / 60),
            seconds: Math.floor((diff / 1000) % 60),
          };
        });

        return newRemaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresMap]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 bg-primary p-5">
        <View className="flex-row items-center justify-between mb-6">
          <TouchOpacity onPress={() => router.back()} otherClasses="h-10 w-10" itemsCenter>
            <ArrowIcon color={Colors.secondary} position="left" size="40%" />
          </TouchOpacity>
          <CustomText color="secondary" boldness="semiBold" classes="text-xl">
            {t("service.list", { defaultValue: "Service list" })}
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
                    ? t("schedules.filters.all", { defaultValue: "All" })
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
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <CustomText color="gray_medium" boldness="medium">
                {t("services.empty", { defaultValue: "You don't have any services yet" })}
              </CustomText>
            </View>
          }
          renderItem={({item})=> {
            const remaining = remainingMap[String(item?.service_id)];
            const scheduleFor = item.schedule ? `${item.schedule.scheduled_day}` : null;
            const priceLabel = (item.amount_for_vendor/100) + "€";

            return <View className="mb-4">
              <ServiceCard
                item={item}
                scheduleFor={scheduleFor}
                price={priceLabel}
                remainingTime={remaining === undefined ? undefined : remaining}
                key={item.service_id}
              >
                {remaining === undefined ? null : remaining === null ? (
                  <CustomText color="error" size="small">{t('schedules.times_up')}</CustomText>
                ) : null}
                <AcceptReject id={item.schedule_id} serviceId={item.service_id} setSelected={setSelected} />
              </ServiceCard>
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
