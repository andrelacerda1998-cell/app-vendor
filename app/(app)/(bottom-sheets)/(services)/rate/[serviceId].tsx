import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { AntDesign, Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import TouchOpacity from '@/components/TouchOpacity';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useDialog } from "@/contexts/DialogContext";
import XIcon from "@/assets/icons/x";
import { ServiceInterface } from "@/types/services";
import DynamicSizingSheet from "@/components/sheets/DynamicSizingSheet";
import { useService } from "@/contexts/ServiceContext";
import UserAvatarIcon from "@/assets/icons/user-avatar";
import { useTranslation } from "react-i18next";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";

const RateServiceBottomSheet = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { historyServices, setHistoryServices } = useService()
  const { serviceId, service: serviceFromParams } = useLocalSearchParams();

  // O param 'service' pode chegar undefined ou malformado (ex.: payload de socket
  // incompleto). Sem esta guarda, o JSON.parse crasha o ecrã inteiro ao montar.
  let service: ServiceInterface | null = null;
  try {
    service = JSON.parse(serviceFromParams as string);
  } catch (_e) {
    service = null;
  }

  const [rate, setRate] = useState(0);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    if (service && service.rating_by_vendor !== null) {
      setRate(Number(service.rating_by_vendor));
    }
  }, [])

  if (!service) {
    // Sem dados do serviço não há nada para avaliar — fechar o sheet em segurança.
    if (router.canGoBack()) router.back();
    else router.navigate('/(app)/(tabs)/home');
    return null;
  }

  // `service` é um `let` reatribuído no try/catch, por isso o TypeScript perde o
  // estreitamento dentro de callbacks — fixamos o valor aqui, depois do guarda.
  const alreadyRated = service.rating_by_vendor !== null;

  const handleRate = (value: number) => {
    setRate(value);
  };

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.navigate('/(app)/(tabs)/home');
  };

  const handleSubmit = () => {
    setLoadingSubmit(true);
    api.put(API_ROUTES.PUT_RATE_SERVICE(serviceId as string), { rate })
      .then(() => {
        let historyService = historyServices.find((service: ServiceInterface) => Number(service.id) === Number(serviceId));
        if (historyService) {
          setHistoryServices(prev =>
            prev.map(service =>
              Number(service.id) === Number(serviceId)
                ? { ...service, rating_by_vendor: rate }
                : service
            )
          );
        }
        onClose();
      })
      .catch((error) => {
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.service_rate.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.service_rate.subtitle'),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        })
      })
      .finally(() => {
        setLoadingSubmit(false);
      });
  };

  return (
    <DynamicSizingSheet
      type="scrollView"
      enablePanDownToClose
      onClose={onClose}
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
      backdropComponent={() => <View style={{ flex: 1, backgroundColor: 'black', opacity: 0.6 }} />}
    >
      {/* <StatusBar animated barStyle="light-content" backgroundColor="rgba(134, 134, 134, 0.1)" translucent /> */}
      <View className="p-5" style={{ backgroundColor: Colors.primary }}>
        <View className="flex-row mx-auto">
          <View className="h-12 w-12 relative -right-1 z-[1]">
            {service?.customer?.avatar?.small ? (
              <Image
                src={service?.customer?.avatar?.small}
                source={{ uri: service?.customer?.avatar?.small }}
                className="w-full h-full object-cover object-center rounded-full"
              />
            ) : (
              <UserAvatarIcon />
            )}
          </View>
          <View className="h-12 w-12 rounded-full flex items-center justify-center relative -left-1" style={{ backgroundColor: Colors.support_primary }}>
            <Feather name="tool" size={22} color={Colors.primary} />
          </View> 
        </View>

        <View className="justify-center flex-1 mt-8">
          <View className="mx-auto">
            <CustomText size="title" boldness="bold" color="secondary" classes="text-center" numberOfLines={1}>
              {service.customer.name}
            </CustomText>
            <CustomText size="medium" boldness="regular" color="gray_medium" classes="text-center px-5 mt-2" numberOfLines={3}>
              {t('services.rate.subtitle')}
            </CustomText>
          </View>

          {/* Cinco botões idênticos e sem nome liam-se como "botão, botão…" num
              leitor de ecrã. Cada estrela anuncia agora quantas atribui. */}
          <View className="items-center flex-row space-x-2 justify-center mt-8">
            {[1, 2, 3, 4, 5].map((value) => {
              const disabled = loadingSubmit || alreadyRated;
              return (
              <TouchOpacity
                key={value}
                onPress={() => handleRate(value)}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityLabel={t('services.rate.star_label', { count: value })}
                accessibilityState={{ selected: rate === value, disabled }}
              >
                <AntDesign name="star" size={40} color={rate >= value ? Colors.support_primary : Colors.gray_medium} />
              </TouchOpacity>
              );
            })}
          </View>
        </View>
      </View>
      {service.rating_by_vendor === null && (
        <View className="p-5">
          <CustomTouchableOpacity
            size="large"
            type="support_primary"
            textColor="primary"
            textBoldness="semiBold"
            text={t('services.rate.send')}
            onPress={handleSubmit}
            disabled={rate === 0 || loadingSubmit}
          />
        </View>
      )}
    </DynamicSizingSheet>
  );
};

export default RateServiceBottomSheet;
