import { CustomText } from '@/components/CustomText'
import OperationAreaCard from "@/components/OperationAreaCard"
import { Colors } from '@/constants/Colors'
import { OperationArea } from "@/types/services"
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FieldErrors, FieldValues } from 'react-hook-form';
import { useTranslation } from "react-i18next"
import { FlatList, View } from 'react-native';
interface ServiceTypeInterface {
  id: number;
  name: string;
  time: number;
  description: string;
  operation_area_id: OperationArea['id'];
}

const SkillsSelectionStep = ({
  control,
  errors,
  availableOperationAreas,
  selectedServicesTypes,
  toggleServiceType
}: {
  control: any,
  errors: FieldErrors<FieldValues>,
  availableOperationAreas: any,
  selectedServicesTypes: ServiceTypeInterface['id'][],
  toggleServiceType: (id: number) => void
}) => {
  const { t } = useTranslation();
  
  return (
    <View className="flex-1 w-full p-5">
      <View className="pb-4">
        <CustomText size="title" color="secondary" boldness="bold" numberOfLines={3}>
          {t('auth.sign_up.skills_selection.title')}
        </CustomText>
        <CustomText color="muted" numberOfLines={3} classes="mt-2">
          {t('auth.sign_up.skills_selection.subtitle')}
        </CustomText>
      </View>

      <FlatList
        data={availableOperationAreas}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View className="h-4" />}
        renderItem={({ item }) => (
          <OperationAreaCard
            key={item.id}
            Icon={() => <Feather name="tool" size={18} color={Colors.brand} />}
            label={item.name}
            onServiceTypePress={toggleServiceType}
            servicesTypes={item.services_types}
            selectedServicesTypes={selectedServicesTypes}
          />
        )}
        ListEmptyComponent={
          <CustomText color="muted" numberOfLines={3} classes="mt-2">
            {t('auth.sign_up.skills_selection.no_skills_found')}
          </CustomText>
        }
      />
    </View>
  )
}

export default SkillsSelectionStep;