import React, { useEffect } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { MaterialIcons, Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import { useService } from '@/contexts/ServiceContext'

/**
 * Cartão-nudge de pedidos pendentes (build 12 "_pendingRequests").
 * Escondido quando não há pedidos; toca para abrir a lista (onde se aceita/recusa).
 */
const PendingRequestsCard = () => {
  const { t } = useTranslation();
  const { pendingServices, getPendingServices } = useService();

  useEffect(() => {
    getPendingServices();
  }, []);

  const count = pendingServices.length;
  if (count === 0) return null;

  return (
    <View className="px-5">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/(app)/(bottom-sheets)/(services)/requests')}
        className="flex-row items-center rounded-2xl border p-4 bg-brand_soft"
        style={{ borderColor: Colors.line }}
      >
        <MaterialIcons name="notifications-active" size={22} color={Colors.brand} />
        <CustomText color="secondary" boldness="bold" numberOfLines={2} classes="flex-1 ml-3">
          {count === 1
            ? t('schedules.pending_requests_card_one', { count })
            : t('schedules.pending_requests_card_other', { count })}
        </CustomText>
        <Feather name="chevron-right" size={20} color={Colors.secondary} />
      </TouchableOpacity>
    </View>
  )
}

export default PendingRequestsCard
