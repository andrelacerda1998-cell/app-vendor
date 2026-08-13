import { Colors } from '@/constants/Colors';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import CustomerPhotos from "@/components/app/CustomerPhotos";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useDialog } from "@/contexts/DialogContext";
import Timer from "@/components/Timer";
import { CustomText } from "@/components/CustomText";
import CheckMark from "@/assets/icons/check-mark";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { useService } from "@/contexts/ServiceContext";
import DynamicSizingSheet from "@/components/sheets/DynamicSizingSheet";
import { useTranslation } from "react-i18next";
import XIcon from "@/assets/icons/x";
import { ServiceStatus } from "@/types/services";
import { useAppStateStatus } from "@/contexts/AppStateStatusContext";
import { renderMoney } from "@/utils/money";

const JobDetail = ({ label, value }: {label: string, value: string}) => (
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

const ServiceProposalBottomSheet = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const serviceId = params.serviceId;
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { openService, setOpenService, pendingService, setPendingService, getPendingServices } = useService();
  const [isLoading, setIsLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const { appStateStatus } = useAppStateStatus();

  const locationLabel = (() => {
    const parts = [
      pendingService?.address?.street_name,
      pendingService?.address?.postal_code,
      pendingService?.address?.city,
    ].filter((value): value is string => Boolean(value && String(value).trim()));

    if (parts.length > 0) return parts.join(", ");
    if (pendingService?.address?.name) return pendingService.address.name;
    if (pendingService?.customer?.address) return pendingService.customer.address;
    return "—";
  })();

  useEffect(() => {
    if (appStateStatus === "active") {
      if (!pendingService || pendingService?.status !== ServiceStatus.PENDING) {
        onClose();
      }
    }
  }, [appStateStatus, pendingService])

  useEffect(() => {
    const onBackPress = () => true; // Prevent going back
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, []);

  const onAcceptService = () => {
    setIsLoading(true);
    api.post(API_ROUTES.VENDOR_ACCEPT_SERVICE_BY_ID(serviceId as string))
      .then(({ data }) => {
        openDialog({
          icon: <CheckMark color={Colors.primary} />,
          title: t('services.service.channel.accepted.title'),
          subtitle: t('services.service.channel.accepted.subtitle'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        })
        if (data.data.service) {
          setOpenService(data.data.service);
          setPendingService(null);
          getPendingServices();
          router.dismissAll();
          router.push(`/(app)/(services)/(open)/progress/${data.data.service.id}`);
        }
        // onClose();
      })
      .catch((error: any) => {
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.service_accept.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.service_accept.subtitle'),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        })
      })
      .finally(() => {
        setIsLoading(false);
      })
  }

  const handleRefuseService = () => {
    openDialog({
      title: t('services.wait_accept.refused.confirmation.title'),
      subtitle: t('services.wait_accept.refused.confirmation.subtitle'),
      cancelButtonText: t('services.wait_accept.refused.confirmation.cancel'),
      successButtonText: t('services.wait_accept.refused.confirmation.confirm'),
      onSuccess() {
        onRefuseService();
      },
    })
  }

  const onRefuseService = () => {
    setIsLoading(true);
    api.post(API_ROUTES.POST_REFUSE_SERVICE(serviceId as string))
      .then(() => {
        setPendingService(null);
        getPendingServices();
        openDialog({
          title: t('services.service.channel.refused.title'),
          subtitle: t('services.service.channel.refused.subtitle'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        })
        onClose();
      })
      .catch((error: any) => {
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.service_refuse.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.service_refuse.subtitle'),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        })
      })
      .finally(() => {
        setIsLoading(false);
      })
  };

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.navigate('/(app)/(tabs)/home');
  }

  return (
    <DynamicSizingSheet
      type="scrollView"
      style={{
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 3,
        },
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
      // enablePanDownToClose
      onClose={onClose}
      backdropComponent={() => <View style={{ flex: 1, backgroundColor: 'black', opacity: 0.6 }} />}
    >
      {/* <StatusBar animated barStyle="light-content" backgroundColor="rgba(134, 134, 134, 0.1)" translucent /> */}
      <View style={{ backgroundColor: Colors.primary, padding: 20, flex: 1 }}>
        <View className="mx-auto">
          <CustomText size="title" color="secondary" classes="text-center" numberOfLines={1}>
            {pendingService?.service_type?.name || t('services.service.no_type')}
          </CustomText>
          <CustomText size="subtitle" color="support_primary" className="text-center" boldness="medium" numberOfLines={1}>
            {pendingService?.service_area?.name || t('services.service.no_area')}
          </CustomText>
          <View className="pt-2">
            <CustomText color="gray_medium" className="text-center" numberOfLines={1}>
              {t('services.service.proposal.title')}
            </CustomText>
          </View>
        </View>

        <View className="items-center justify-center flex-1 py-4">
          <Timer onTimeout={() => {
            setDisableButton(true);
            setPendingService(null);
            onClose();
          }} />
        </View>

        <View className="justify-end items-center space-y-2 py-2">
          {pendingService?.schedule && (
            <JobDetail
              label={t('schedules.schedule_for')}
              value={`${pendingService?.schedule?.date_label || pendingService?.schedule?.scheduled_day || ''} ${pendingService?.schedule?.scheduled_time?.start?.slice(0, 5) || ''} - ${pendingService?.schedule?.scheduled_time?.end?.slice(0, 5) || ''}`}
            />
          )}
          {!pendingService?.schedule && (
            <JobDetail
              label={t('schedules.when', { defaultValue: 'Quando' })}
              value={t('schedules.now', { defaultValue: 'Agora' })}
            />
          )}
          <JobDetail
            label={t('services.service.proposal.location')}
            value={locationLabel}
          />
          <JobDetail
            label={t('services.service.proposal.value_to_receive')}
            value={renderMoney(pendingService?.amount_for_vendor || null) || t('services.service.no_price')}
          />
        </View>

        {/* Descrição e fotos do cliente: é aqui, ANTES de aceitar, que valem —
            dão ao técnico o "o que é isto?" para decidir se vai e o que leva na
            carrinha. Antes só apareciam depois de aceitar (ecrã de estado). Só
            se mostram quando existem mesmo. */}
        {!!pendingService?.customer_notes && (
          <View
            className="mt-4 rounded-2xl p-3 border flex-row"
            style={{ backgroundColor: Colors.card_high, borderColor: Colors.line }}
          >
            <Feather name="message-square" size={16} color={Colors.brand} style={{ marginTop: 2 }} />
            <View className="flex-1 ml-2">
              <CustomText color="muted" size="extraSmall" boldness="bold">
                {t('schedules.customer_notes', { defaultValue: 'Observações do cliente' }).toUpperCase()}
              </CustomText>
              <CustomText color="secondary" size="small" numberOfLines={5} classes="mt-1">
                {pendingService.customer_notes}
              </CustomText>
            </View>
          </View>
        )}

        <CustomerPhotos photos={pendingService?.customer_photos} />
      </View>
      <View className="flex-row justify-between p-5">
        <View className="w-[47%]">
          <CustomTouchableOpacity
            size="large"
            type="secondary_outline"
            textColor="secondary"
            textBoldness="semiBold"
            text={t('services.service.proposal.refuse')}
            onPress={handleRefuseService}
            disabled={isLoading || !pendingService || disableButton}
          />
        </View>

        <View className="w-[47%]">
          <CustomTouchableOpacity
            size="large"
            type="support_primary"
            textColor="primary"
            textBoldness="semiBold"
            text={t('services.service.proposal.accept')}
            onPress={onAcceptService}
            disabled={isLoading || !pendingService || disableButton}
          />
        </View>
      </View>
    </DynamicSizingSheet>
  );
};

export default ServiceProposalBottomSheet;
