import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useService } from "@/contexts/ServiceContext";
import { useSession } from "@/contexts/SessionContext";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import BackHeader from "@/components/app/BackHeader";
import { CustomText } from "@/components/CustomText";
import { ServiceTypeInterface } from "@/types/services";
import { useDialog } from "@/contexts/DialogContext";
import XIcon from "@/assets/icons/x";
import { Colors } from "@/constants/Colors";
import OperationAreaCard from "@/components/OperationAreaCard";
import { SectionHeader } from "@/components/ui";

export type Screen = 'operationAreas' | 'servicesTypes';

const AreasBottomSheet = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { getOperationAreas, operationAreas } = useService();
  const { vendorData } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedServicesTypes, setSelectedServicesTypes] = useState<ServiceTypeInterface['id'][]>(
    operationAreas?.map(area => area?.services_types_subscribed || []).flat() || []
  );

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.navigate('/(app)/(tabs)/home');
  };

  const handleUpdateServicesTypes = () => {
    openDialog({
      title: t('operation_areas.update.title'),
      subtitle: t('operation_areas.update.subtitle'),
      successButtonText: t('operation_areas.update.confirm'),
      cancelButtonText: t('operation_areas.update.cancel'),
      onSuccess: updateServicesTypes,
    });
  }

  const updateServicesTypes = async () => {
    setIsLoading(true);
    try {
      await api.post(API_ROUTES.VENDOR_SET_SERVICE_TYPES, { services: selectedServicesTypes.map(id => ({ id })) });
      onClose();
      await getOperationAreas();
    } catch (error: any) {
      openDialog({
        icon: <XIcon color={Colors.primary} />,
        title: t('errors.areas_save.title'),
        subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.areas_save.subtitle'),
        closeAfterMSeconds: 2000,
        closeOnClickOutside: true,
      })
    } finally {
      setIsLoading(false);
    }
  };

  const toggleServiceType = (serviceTypeId: number) => {
    setSelectedServicesTypes((prev: number[]) => {
      if (prev.includes(serviceTypeId)) {
        return prev.filter((id: number) => id !== serviceTypeId);
      }
      return [...prev, serviceTypeId];
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('operation_areas.services_types.header')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />
      <View className="flex-1 px-5">
        <SectionHeader title={t('operation_areas.services_types.subheader')} />
        <View className="mb-5 flex-1">
          <FlatList
            data={operationAreas}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              return (
                <OperationAreaCard
                  key={item.id}
                  label={item.name}
                  onServiceTypePress={toggleServiceType}
                  servicesTypes={item.services_types}
                  selectedServicesTypes={selectedServicesTypes}
                  hourRate={vendorData?.price_rate != null ? Number(vendorData.price_rate) : null}
                />
              )
            }}
          />
        </View>
        <CustomTouchableOpacity
          size="large"
          type="support_primary"
          textSize="medium"
          textColor="on_brand"
          textBoldness="bold"
          text={t('operation_areas.update_skills')}
          onPress={handleUpdateServicesTypes}
          disabled={isLoading}
          classes="mb-4"
        />
      </View>
    </SafeAreaView>
  );
};

export default AreasBottomSheet;
