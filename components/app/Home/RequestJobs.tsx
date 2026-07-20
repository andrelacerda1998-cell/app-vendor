import HomeSection from "@/components/HomeSection";
import {View} from "react-native";
import {CustomText} from "@/components/CustomText";
import React, {useEffect, useState} from "react";
import {router} from "expo-router";
import AcceptReject, {AcceptRejectType} from "@/components/Buttons/AcceptReject";
import {useApi} from "@/contexts/ApiContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import {useSession} from '@/contexts/SessionContext';
import {useService} from "@/contexts/ServiceContext";
import { useTranslation } from "react-i18next";
import { useDialog } from "@/contexts/DialogContext";
import ServiceCard from "@/components/app/ServiceCard";

const ACCEPT_WINDOW = 20 * 60 * 1000;

const RequestJobs = () => {
  const { pendingServices, setPendingServices, getPendingServices, setOpenService, getOpenService } = useService();
  const [selected, setSelected] = useState<AcceptRejectType>({id: null, service_id: null, accepted: false});
  const { api } = useApi();
  const {  vendorData }  = useSession();
  const [ hoursOfService, setHoursOfService] = useState<any>({});
  const { t } = useTranslation();
  const { openDialog } = useDialog();

  const [createdAt, setCreatedAt] = useState<number>(0);
  const [ expires, setExpires] = useState<number>(0);

  const getRemaining = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return null;

    return {
      minutes: Math.floor(diff / 1000 / 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  const [remaining, setRemaining] = useState<{ minutes: number; seconds: number } | null | undefined>(undefined);

  const getNextPendingService = () => {
    console.log('[RequestJobs] getNextPendingService called');
    setPendingServices((prev) => {
      const newList = (prev ?? []).slice(1);
      console.log('[RequestJobs] New pending list:', newList.length);
      return newList;
    });
    setSelected({id: null, service_id: null, accepted: false});
    getPendingServices();
  }

  useEffect(() => {
    if (!selected.id && !selected.service_id) return;

    if (!selected.accepted && selected.service_id) {
      api.post(API_ROUTES.POST_REFUSE_SERVICE(selected.service_id as string)).then(() => {
        getNextPendingService();
      }).catch((error) => {
        console.log(error);
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

    if (selected.accepted && selected.id) {
      api.post(API_ROUTES.VENDOR_ACCEPT_SCHEDULED_SERVICE, {
        schedule_id: selected.id
      }).then(() => {
        getNextPendingService();
        getOpenService();
      }).catch((error) => {
        console.log(error.message, error.response, "error on accept scheduled service");
        openDialog({
          title: t('errors.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
        getPendingServices();
      })
      return;
    }

    if (selected.accepted && !selected.id && selected.service_id) {
      api.post(API_ROUTES.VENDOR_ACCEPT_SERVICE_BY_ID(selected.service_id as string)).then(({ data }) => {
        if (data?.data?.service) {
          setOpenService(data.data.service);
        } else {
          getOpenService();
        }
        getNextPendingService();
      }).catch((error) => {
        console.log(error.message, error.response, "error on accept immediate service");
        openDialog({
          title: t('errors.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
        getPendingServices();
      });
    }
  }, [selected])

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

  const isStrictNumber = (value: any) => {
    return typeof value === "number" && Number.isFinite(value);
  };

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

  useEffect(()=> {
    console.log('[RequestJobs] pendingServices updated:', pendingServices?.length);
    fetchAllOperationHours();

    if(pendingServices &&
      Array.isArray(pendingServices) &&
      pendingServices.length > 0 &&
      pendingServices[0].created_at
      ){
      // Normalize timestamp: if less than 1e12, it's in seconds, convert to milliseconds
      const rawCreatedAt = pendingServices[0].created_at;
      const normalizedCreatedAt = rawCreatedAt < 1e12 ? rawCreatedAt * 1000 : rawCreatedAt;
      setCreatedAt(normalizedCreatedAt);
    }
  }, [pendingServices]);

  useEffect(()=> {
    if(createdAt !== 0){
      setExpires(createdAt + ACCEPT_WINDOW);
    }
  }, [createdAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getRemaining(expires));
    }, 1000);

    return () => clearInterval(interval);
  }, [expires]);

  useEffect(() => {
    getPendingServices();
  }, []);
  console.log(pendingServices)

  return (
    <HomeSection
      title={`${t('schedules.requests_list')} (${pendingServices.length})`}
      actionButton={() => router.push('/(app)/(bottom-sheets)/(services)/requests')}
      actionButtonText="Ver Todos"
      >
      {pendingServices.length > 0 && (
        <View className="flex-1">
          <View className="pt-4 px-5">
            <ServiceCard
              item={pendingServices[0]}
              scheduleFor={pendingServices[0]?.schedule
                ? `${pendingServices[0]?.schedule?.scheduled_day || ''}`
                : null}
              price={pendingServices[0].amount_for_vendor/100 + "€"}
              remainingTime={remaining === undefined ? undefined : remaining}
            >
              {remaining === undefined ? null : remaining === null ? (
                <CustomText color="error" size="small">{t('schedules.times_up')}</CustomText>
              ) : null}
              <AcceptReject id={pendingServices[0]?.schedule_id} serviceId={pendingServices[0]?.service_id} setSelected={setSelected} />
            </ServiceCard>
          </View>
        </View>
      )}
    </HomeSection>
  );
}

export default RequestJobs;
