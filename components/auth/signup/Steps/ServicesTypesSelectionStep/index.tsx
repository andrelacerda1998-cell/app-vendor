import { CustomText } from '@/components/CustomText'
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { API_ROUTES } from "@/constants/ApiRoutes"
import { useApi } from "@/contexts/ApiContext"
import i18n from "@/translation"
import { OperationArea } from "@/types/services"
import React, { useEffect, useMemo, useState } from 'react';
import { FieldErrors, FieldValues } from 'react-hook-form';
import { useTranslation } from "react-i18next"
import { FlatList, View } from 'react-native';
import ServiceTypeItemSelector from "@/components/services/ServiceTypeItemSelector"

interface ServiceTypeInterface {
  id: number;
  name: string;
  time: number;
  description: string;
  operation_area_id: OperationArea['id'];
}

const ServicesTypesSelectionStep = ({
  control,
  errors,
  availableOperationAreas,
  selectedOperationAreas,
  // setSelectedOperationAreas
  selectedServicesTypes,
  setSelectedServicesTypes
}: {
  control: any,
  errors: FieldErrors<FieldValues>,
  availableOperationAreas: any,
  selectedOperationAreas: number[],
  // setSelectedOperationAreas: (areas: number[] | ((prev: number[]) => number[])) => void
  selectedServicesTypes: number[],
  setSelectedServicesTypes: (areas: number[] | ((prev: number[]) => number[])) => void
}) => {
  const { t } = useTranslation();
  const { api } = useApi();
  
  const operationAreasSelectedWithName = availableOperationAreas.filter((area: any) => selectedOperationAreas.includes(area.id));
  const [selectedOperationArea, setSelectedOperationArea] = useState<number | null>(operationAreasSelectedWithName[0].id || null);
  const [servicesTypes, setServicesTypes] = useState<ServiceTypeInterface[]>([]);
  const [loadingServicesTypes, setLoadingServicesTypes] = useState(false);


  useEffect(() => {
    getServicesTypes();
  }, [])

  const addServiceType = (serviceTypeId: number) => {
    setSelectedServicesTypes((prev: number[]) => {
      if (prev.includes(serviceTypeId)) {
        return prev.filter((id: number) => id !== serviceTypeId);
      }
      return [...prev, serviceTypeId];
    });
  };

  const getServicesTypes = async () => {
    setLoadingServicesTypes(true);
    try {
      const res = await api.get(API_ROUTES.GET_SERVICES_TYPES, {
        headers: {
          'Accept-Language': i18n.language === 'pt_PT' ? 'pt-pt' : 'en',
        }
      });
      const services = res.data.data.services;
      setServicesTypes(res.data.data.services || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingServicesTypes(false);
    }
    // setOperationAreas(availableOperationAreas.filter((area) => selectedOperationAreas.includes(area.id)));
  };

  const filteredServicesTypes = useMemo(() => {
    return servicesTypes.filter(item => item.operation_area_id === selectedOperationArea)
  }, [servicesTypes, selectedOperationArea]);

  return (
    <View className="flex-1 w-full">

      <FlatList
        data={operationAreasSelectedWithName}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        // contentContainerStyle={{
        //   height: 60,
        // }}
        // ItemSeparatorComponent={() => <View className="w-5" />}
        renderItem={({ item }) => (
          // <Checkbox
          //   label={item.name}
          //   checked={selectedServicesTypes.includes(item.id)}
          //   onChange={() => addServiceType(item.id)}
          //   touchableClasses="mt-2 py-1"
          // />
          <View className="h-fit">
            <CustomTouchableOpacity
              type={selectedOperationArea === item.id ? 'support_primary' : 'support_primary_outline'}
              size="large"
              text={item.name}
              textSize="medium"
              textColor={selectedOperationArea === item.id ? 'white' : 'support_primary'}
              textBoldness="semiBold"
              // className="w-fit"
              classes="rounded-none rounded-t-xl"
              onPress={() => {
                setSelectedOperationArea(item.id);
              }}
              // disabled={loading}
            />
          </View>
        )}
        ListEmptyComponent={
          <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
            {t('auth.sign_up.services_types_selection.no_services_found')}
          </CustomText>
        }
        className="flex-grow-0"
      />

      <View className="py-8 px-5">
        <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
          {t('auth.sign_up.services_types_selection.title')}
        </CustomText>
        <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
          {t('auth.sign_up.services_types_selection.subtitle')}
        </CustomText>
      </View>

      {loadingServicesTypes ? (
        <View className="flex-1 items-center justify-center px-5">
          <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
            {t('auth.sign_up.services_types_selection.loading_services')}
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={filteredServicesTypes}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View className="h-4" />}
          renderItem={({ item }) => {
            const isSelected = selectedServicesTypes.includes(item.id);
  
            return (
              <ServiceTypeItemSelector
                item={item}
                isSelected={isSelected}
                addServiceType={addServiceType}
              />
            )
          }}
          ListEmptyComponent={
            <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
              {t('auth.sign_up.services_types_selection.no_services_found')}
            </CustomText>
          }
          className="px-5"
        />
      )}
    </View>
  )
}

export default ServicesTypesSelectionStep;