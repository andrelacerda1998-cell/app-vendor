import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from "@/contexts/DialogContext";
import DynamicSizingSheet from "@/components/sheets/DynamicSizingSheet";
import { CustomText } from "@/components/CustomText";
import { PaymentHistoryInterface } from "@/types/wallet";
import UserAvatarIcon from "@/assets/icons/user-avatar";
import i18n from "@/translation";
import { renderMoney } from "@/utils/money";

const WalletHistoryBottomSheet = () => {
  const { api } = useApi();
  const { openDialog } = useDialog();
  const params = useLocalSearchParams();
  const [rate, setRate] = useState(0);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  // Sem parâmetro este ecrã não tem o que mostrar. Antes fazia JSON.parse(undefined)
  // e rebentava; agora devolve o utilizador à lista de movimentos.
  const paymentHistory = useMemo<PaymentHistoryInterface | null>(() => {
    if (typeof params.history !== 'string') return null;
    try {
      return JSON.parse(params.history) as PaymentHistoryInterface;
    } catch {
      return null;
    }
  }, [params.history]);

  useEffect(() => {
    if (!paymentHistory) router.replace('/(app)/(pages)/(payouts)/payouts');
  }, [paymentHistory]);

  // useEffect(() => {
  //   if (serviceRate !== "null") {
  //     setRate(Number(serviceRate));
  //   }
  // }, [])

  // const handleRate = (value: number) => {
  //   setRate(value);
  // };

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.navigate('/(app)/(tabs)/home');
  };

  // const handleSubmit = () => {
  //   setLoadingSubmit(true);
  //   api.put(API_ROUTES.PUT_RATE_SERVICE(serviceId as string), { rate })
  //     .then(() => {
  //       onClose();
  //     })
  //     .catch((error) => {
  //       openDialog({
  //         icon: <XIcon color={Colors.primary} />,
  //         title: 'Error',
  //         subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || 'Please, wait before trying again',
  //         closeAfterMSeconds: 2000,
  //         closeOnClickOutside: true,
  //       })
  //     })
  //     .finally(() => {
  //       setLoadingSubmit(false);
  //     });
  // };

  const renderDate = (date: string) => {
    const dateObj = new Date(date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const year = dateObj.getFullYear();

    return `${day} ${month} ${year}`;
  };

  const renderHour = (date: string) => {
    const dateObj = new Date(date);
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    const is24HourFormat = i18n?.language === 'pt_PT';

    if (is24HourFormat) {
      const formattedHours = hours < 10 ? '0' + hours : hours;
      return `${formattedHours}:${formattedMinutes}`;
    } else {
      const displayHours = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${displayHours}:${formattedMinutes}${ampm}`;
    }
  }

  // Enquanto o redirecionamento acima acontece, não há nada para desenhar.
  if (!paymentHistory) return null;

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
      <View className="bg-primary p-5">

        <CustomText
          color="secondary"
          size="large"
          boldness="bold"

        >
          {paymentHistory.service.description}
        </CustomText>

        <View className="flex flex-row justify-between items-center my-3">
          <View className="h-12 w-12">
            {paymentHistory?.service?.customer?.avatar?.small ? (
              <Image
                src={paymentHistory?.service?.customer?.avatar?.small}
                source={{ uri: paymentHistory?.service?.customer?.avatar?.small }}
                className="w-full h-full object-cover object-center rounded-full"
              />
            ) : (
              <UserAvatarIcon />
            )}
          </View>
          <View className="items-end">
            <CustomText
              color="secondary"
              size="small"
              boldness="regular"
            >
              {renderDate(paymentHistory.created_at)}
            </CustomText>
            <CustomText
              color="secondary"
              size="small"
              boldness="regular"
            >
              {renderHour(paymentHistory.created_at)}
            </CustomText>
          </View>
        </View>

        <View className="h-[1px] w-full bg-support_secondary my-3"></View>

        <View className="flex flex-row items-center my-3">
          <View className="flex-1">
            <CustomText
              color="secondary"
              size="title"
              boldness="regular"
            >
              {renderMoney(paymentHistory.amount)}
            </CustomText>
            <CustomText
              color="secondary"
              size="medium"
              boldness="regular"
            >
              {paymentHistory.service.admin_description}
            </CustomText>
          </View>
          <View className="bg-[#e0ffde] px-3 py-[2px] rounded-full flex-grow-0">
            <CustomText
              color="success"
              size="medium"
              boldness="regular"
            >
              <MaterialCommunityIcons name="check" size={18} color={Colors.success} /> {paymentHistory.type}
            </CustomText>
          </View>
        </View>

      </View>
    </DynamicSizingSheet>
  );
};

export default WalletHistoryBottomSheet;
