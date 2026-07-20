import Checkbox from '@/components/Checkbox'
import { CustomText } from '@/components/CustomText'
import DatePicker from '@/components/DatePicker'
import OperationAreaCard from "@/components/OperationAreaCard"
import { ThemedText } from '@/components/ThemedText'
import { API_ROUTES } from "@/constants/ApiRoutes"
import { Colors } from '@/constants/Colors'
import { useApi } from "@/contexts/ApiContext"
import i18n from "@/translation"
import { OperationArea } from "@/types/services"
import { Feather, FontAwesome, FontAwesome6 } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { Controller, FieldErrors, FieldValues, set } from 'react-hook-form'
import { useTranslation } from "react-i18next"
import { FlatList, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native'

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
        <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
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
            Icon={() => <Feather name="tool" size={32} color={Colors.support_primary} />}
            label={item.name}
            onServiceTypePress={toggleServiceType}
            servicesTypes={item.services_types}
            selectedServicesTypes={selectedServicesTypes}
          />
        )}
        ListEmptyComponent={
          <CustomText color="gray_medium" numberOfLines={3} classes="mt-2">
            {t('auth.sign_up.skills_selection.no_skills_found')}
          </CustomText>
        }
      />
    </View>
  )
}

export default SkillsSelectionStep;