import BottomSheet from "@gorhom/bottom-sheet";
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from "react-native";
import { CustomText } from "@/components/CustomText"
import { Colors } from "@/constants/Colors"
import { Entypo } from "@expo/vector-icons"
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import ChatIcon from "@/assets/icons/chat"
import { router } from "expo-router"
import { useService } from "@/contexts/ServiceContext"
import DynamicSizingSheet from "@/components/sheets/DynamicSizingSheet"
import { useTranslation } from "react-i18next"
import UserAvatarIcon from "@/assets/icons/user-avatar"
import haversineDistance from "@/utils/map/distanceCoords";
import { ServiceStatus } from "@/types/services"
import {API_ROUTES} from "@/constants/ApiRoutes";
import CheckMark from "@/assets/icons/check-mark";
import XIcon from "@/assets/icons/x";
import {useApi} from "@/contexts/ApiContext";
import {useDialog} from "@/contexts/DialogContext";

const formatCustomerName = (name?: string | null) => {
  if (name && name.trim()) return name.trim();
  return null;
};

const ServiceInProgress = ({ isHome, onContentHeightChange }: { isHome?: boolean, onContentHeightChange?: (height: number) => void }) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { openService, setOpenService, unreadMessages, clearUnreadMessages } = useService();
  const [distance, setDistance] = useState(0);
  const { api } = useApi();
  const { openDialog } = useDialog();

  const goToChat = () => {
    clearUnreadMessages();
    router.push(`/(app)/(services)/(open)/(chat)/service/${openService?.id}`);
  }

  const goToCancel = () => {
    router.push(`/(app)/(services)/(open)/cancel/${openService?.id}`);
  }

  const goToServiceStatus = () => {
    router.navigate(`/(app)/(services)/(open)/status/${openService?.id}`);
  }

  const arrivedAtDestination = () => {
    if (openService?.status === ServiceStatus.ARRIVED) return;
    api.post(API_ROUTES.POST_ARRIVED_AT_DESTINATION_SERVICE(`${openService?.id}`))
      .then(({data}) => {
        setOpenService(data.data.service);
        openDialog({
          icon: <CheckMark color={Colors.primary}/>,
          title: t('chat.arrived_at_destination.title'),
          subtitle: t('chat.arrived_at_destination.subtitle'),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        })
      })
      .catch(() => {
        openDialog({
          icon: <XIcon color={Colors.primary}/>,
          title: t('errors.chat_arrived.title'),
          subtitle: t('errors.chat_arrived.subtitle'),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        })
      })

    goToChat();
  }

  useEffect(() => {
    // @ts-ignore
    const houseLat = parseFloat(openService?.address?.latitude);
    // @ts-ignore
    const houseLng = parseFloat(openService?.address?.longitude);

    // @ts-ignore
    const vendorLat = parseFloat(openService?.vendor?.location?.latitude);
    // @ts-ignore
    const vendorLng = parseFloat(openService?.vendor?.location?.longitude);


    setDistance(haversineDistance(houseLat, houseLng, vendorLat, vendorLng));
  } ,[openService])

  const customerName = formatCustomerName(openService?.customer?.name);

  return (
    <DynamicSizingSheet
      type="scrollView"
      // ref={bottomSheetRef}
      // snapPoints={['30%', contentHeight ? contentHeight + (isHome ? 130 : 30) : 30]}
      style={{
        backgroundColor: Colors.card,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      backgroundStyle={{
        backgroundColor: Colors.card,
      }}
      handleIndicatorStyle={{
        backgroundColor: Colors.line,
        width: 60,
      }}
      onClose={() => {
        bottomSheetRef && bottomSheetRef.current?.snapToIndex(1);
      }}
    >
      <View
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (onContentHeightChange) onContentHeightChange(height);
        }}
      >
        <View className="flex-row justify-between p-4">
          <View className="flex-1 flex-row items-center pr-3">
            <View className="flex-row w-20 items-center">
              <View className="h-12 w-12 z-[1] rounded-full">
                {openService?.customer?.avatar?.small ? (
                  <Image
                    src={openService?.customer?.avatar?.small}
                    source={{ uri: openService?.customer?.avatar?.small }}
                    className="w-full h-full object-cover object-center rounded-full"
                  />
                ) : (
                  <UserAvatarIcon />
                )}
              </View>
              <View className="h-12 w-12 rounded-full flex items-center justify-center relative -left-5" style={{ backgroundColor: Colors.support_primary }}>
                <Entypo name="back-in-time" size={22} color={Colors.primary} />
              </View>
            </View>
            {customerName ? (
              <View className="flex-1 ml-3">
                <CustomText color="secondary" size="small" boldness="semiBold" numberOfLines={1}>
                  {customerName}
                </CustomText>
              </View>
            ) : null}
          </View>
          <View className="px-4 h-6 justify-center rounded-full" style={{ backgroundColor: Colors.brand_soft }}>
            <CustomText size="extraSmall" color="brand" boldness="bold" numberOfLines={1}>
              {Number.isFinite(distance) && distance > 0
                ? `${distance.toFixed(1)} km`
                : t('services.service.open.no_distance')}
            </CustomText>
          </View>
        </View>
        {/* <View>
          <View className="flex-row justify-between p-4">
            <CustomText color="secondary" size="small" boldness="semiBold">
              {t('services.service.open.in_progress')}
            </CustomText>
            <CustomText color="secondary" size="small" boldness="regular">
              00:18
            </CustomText>
          </View>
          <View className="px-4">
            <View className="h-2 rounded-full w-full" style={{ backgroundColor: Colors.gray_strong }}></View>
            <View className="h-2 left-4 rounded-full w-[30%] absolute" style={{ backgroundColor: Colors.support_primary }}></View>
          </View>
        </View> */}
        <View className="p-4">
          <CustomTouchableOpacity
            onPress={() => goToChat()}
            type="support_primary_outline"
            size="large"
            text={t('chat.title')}
            textColor="secondary"
            textBoldness="semiBold"
            classes="mb-4"
            Icon={() => (
              <View className="w-6 h-6 relative">
                <ChatIcon color={Colors.support_primary} />
                {unreadMessages > 0 && (
                  <View className="bg-red-500 rounded-full h-3 w-3 absolute -top-1 -right-1" />
                )}
              </View>
            )}
          />
          <View className="flex-row justify-between">
            {(
              openService?.status === ServiceStatus.ACCEPTED ||
              openService?.status === ServiceStatus.ARRIVED
            ) && (
              <CustomTouchableOpacity
            onPress={arrivedAtDestination}
            type="support_primary"
            size="large"
            text={t('chat.actions.arrived')}
            textColor="on_brand"
            textBoldness="bold"
            classes="w-[48%]"
            disabled={openService?.status === ServiceStatus.ARRIVED}
          />
            )}
            <CustomTouchableOpacity
              onPress={goToServiceStatus}
              type="secondary_outline"
              size="large"
              text={t('services.service.open.status')}
              textColor="secondary"
              textBoldness="semiBold"
              classes={`${(
                openService?.status === ServiceStatus.ACCEPTED ||
                openService?.status === ServiceStatus.ARRIVED
              ) ? 'w-[48%]' : 'w-full'}`}
            />
          </View>
        </View>
      </View>
    </DynamicSizingSheet>
  )
}

export default ServiceInProgress
