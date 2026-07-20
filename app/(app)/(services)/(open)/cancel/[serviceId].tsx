import { ThemedText } from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import { AntDesign, Entypo, Feather, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, FlatList, Image, ImageSourcePropType, Pressable, ScrollView, TouchableOpacity, View } from 'react-native'
import TouchOpacity from '@/components/TouchOpacity'
import BackHeader from '@/components/app/BackHeader'
import { Picker, PickerIOS } from '@react-native-picker/picker'
import { useApi } from '@/contexts/ApiContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { useSession } from '@/contexts/SessionContext'
import useEcho from '@/hooks/echo'
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { CustomText } from "@/components/CustomText"
import { useService } from "@/contexts/ServiceContext"
import ChatIcon from "@/assets/icons/chat"
import { useDialog } from "@/contexts/DialogContext"
import { useTranslation } from "react-i18next"
import { renderMoney } from "@/utils/money"

interface VendorsInterface {
  distance: number,
  id: number,
  name: string,
  // nif: string,
  rate: number,
  rating: number
}

const CancelService = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData } = useSession();
  const echo = useEcho();
  const { openService, setOpenService } = useService();
  const { openDialog } = useDialog();
  // // const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { serviceId } = useLocalSearchParams();

  const handleCancelService = () => {
    openDialog({
      title: t('services.cancel.title'),
      subtitle: t('services.cancel.subtitle'),
      successButtonText: t('services.cancel.confirm'),
      cancelButtonText: t('services.cancel.cancel'),
      onSuccess() {
        setIsLoading(true);
        api.post(API_ROUTES.POST_CANCEL_SERVICE(serviceId as string))
          .then(() => {
            openDialog({
              title: t('services.wait_accept.canceled.title'),
              subtitle: t('services.wait_accept.canceled.subtitle'),
              closeAfterMSeconds: 3000,
              closeOnClickOutside: false,
              onClose: () => {
                setOpenService(null);
                return router.navigate('/(app)/(tabs)/home');
              }
            })
          })
          .catch(() => {
            openDialog({
              title: t('services.cancel.error.title'),
              subtitle: t('services.cancel.error.subtitle'),
              closeAfterMSeconds: 3000,
              closeOnClickOutside: true,
            });
          })
          .finally(() => {
            setIsLoading(false);
          });
      },
    })
  }

  // Regra: cancelar com menos de 24h de antecedência tem penalização de 10% do
  // valor do serviço. O modelo do serviço aberto ainda não expõe a hora
  // agendada no cliente, por isso mostramos sempre a regra e o valor (a
  // aplicação do desconto é decidida no backend consoante a antecedência).
  const LATE_CANCEL_RATE = 0.1;
  const amountForVendor = openService?.amount_for_vendor ?? openService?.amount ?? 0;
  const penaltyCents = Math.round(amountForVendor * LATE_CANCEL_RATE);

  return (
    <SafeAreaView className="flex-1 bg-strongest">
      {/* <StatusBar backgroundColor={Colors.primary} animated /> */}

      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {openService?.service_type?.name || ''}
          </CustomText>
        )}
        otherClasses="p-5"
      />

      <View className="bg-primary p-5 flex-1 rounded-t-3xl space-y-4">
        <View className="flex-1 justify-center items-center">
          <ScrollView className="w-full flex-grow-0">
            <View className="items-center">
              <MaterialIcons name="cancel" size={90} color={Colors.secondary} />
            </View>

            <CustomText color="secondary" boldness="medium" size="large" numberOfLines={3} classes="text-center mt-4">
              {t('services.cancel.you_are_about_to')}
            </CustomText>

            {/* Penalização por cancelamento tardio (< 24h): 10% do valor. */}
            <View
              className="mt-5 rounded-2xl p-4"
              style={{
                backgroundColor: 'rgba(237, 73, 73, 0.14)',
                borderWidth: 1,
                borderColor: Colors.error,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="warning" size={20} color={Colors.error} />
                <CustomText color="secondary" boldness="semiBold" numberOfLines={1} classes="ml-2">
                  {t('services.cancel.penalty.title')}
                </CustomText>
              </View>
              <CustomText color="secondary" boldness="regular" numberOfLines={3} classes="mt-1">
                {t('services.cancel.penalty.body', { amount: renderMoney(penaltyCents) })}
              </CustomText>
            </View>

          </ScrollView>
        </View>
        
        <View>
          <View>
            <CustomTouchableOpacity
              size="large"
              type="secondary"
              textColor="primary"
              textBoldness="semiBold"
              text={t('services.cancel.confirm_cancellation')}
              onPress={handleCancelService}
              disabled={isLoading}
            />
          </View>
          {/* <CustomTouchableOpacity
            size="large"
            type="primary_outline"
            textColor="support_secondary"
            textBoldness="semiBold"
            text="Help"
            disabled={isLoading}
            // onPress={openService}
            Icon={() => (
              <View className="w-6 h-6">
                <ChatIcon color={Colors.primary} />
              </View>
            )}
          /> */}
        </View>
      </View>

    </SafeAreaView>
  )
}

export default CancelService;
