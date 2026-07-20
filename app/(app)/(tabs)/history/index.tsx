import ArrowIcon from "@/assets/icons/arrow"
import UserAvatarIcon from "@/assets/icons/user-avatar"
import XIcon from "@/assets/icons/x"
import BackHeader from "@/components/app/BackHeader"
import { CustomText } from "@/components/CustomText"
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { API_ROUTES } from "@/constants/ApiRoutes"
import { Colors } from "@/constants/Colors"
import { useApi } from "@/contexts/ApiContext"
import { useDialog } from "@/contexts/DialogContext"
import { useService } from "@/contexts/ServiceContext"
import i18n from "@/translation"
import { ServiceInterface } from "@/types/services"
import { renderMoney } from "@/utils/money"
import { AntDesign, Entypo, Feather } from "@expo/vector-icons"
import IDomParser from "advanced-html-parser"
import { router, useFocusEffect } from "expo-router"
import React, { useCallback, useState } from 'react'
import { useTranslation } from "react-i18next"
import {FlatList, Image, Platform, View} from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"

const History = () => {
  const { t } = useTranslation()
  const { historyServices, getHistoryServices, loadingServicesHistory, haveMoreServicesHistory } = useService()

  useFocusEffect(
    useCallback(() => {
      getHistoryServices(0);
    }, [])
  );

  const goToServiceHistory = (service: ServiceInterface) => {
    router.navigate(`/(app)/(services)/history/${service.id}`);
  }

  const renderDate = (date: string) => {
    const parsedDate = new Date(date);
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    const locale = i18n.language === 'pt_PT' ? 'pt-PT' : 'en-US';
    const formattedDate = parsedDate.toLocaleDateString(locale, dateOptions);

    return formattedDate.replace(',', ' |');
  }

  return (
    <SafeAreaView className="flex-1 bg-strongest">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="medium" numberOfLines={1}>
            {t('services.history.header')}
          </CustomText>
        )}
        otherClasses="p-5"
      />
      <View className="h-full bg-secondary p-5 rounded-t-3xl">
        {loadingServicesHistory && historyServices.length === 0
          ? (
            <View className="flex-1">
              {Array.from({ length: 12 }).map((_, index) => (
                <View key={`skeleton-item-${index}`}>
                  <View className="flex flex-row my-4">
                    <View className="w-20 h-fit justify-center">
                      <View className="rounded-full overflow-hidden w-10 h-10">
                        <View className="w-full h-full bg-strongest"></View>
                      </View>
                      <View className="rounded-full overflow-hidden w-10 h-10 absolute left-8 -z-[1]">
                        <View className="w-full h-full bg-strongest"></View>
                      </View>
                    </View>

                    <View className="flex-1 space-y-1 ml-2">
                      <View className="w-[80%] rounded-xl overflow-hidden">
                        <View className="h-5 bg-strongest"></View>
                      </View>
                      <View className="w-[50%] rounded-xl overflow-hidden">
                        <View className="h-4 bg-strongest"></View>
                      </View>
                      <View className="w-[65%] rounded-xl overflow-hidden">
                        <View className="h-3 bg-strongest"></View>
                      </View>
                    </View>

                    <View className="w-8 justify-center">
                      <View className="w-full h-5 bg-strongest rounded-xl"></View>
                    </View>
                  </View>
                  <View className="h-[1px] mx-auto w-full bg-gray_strong" />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={historyServices}
              keyExtractor={(_, index) => index.toString()}
              className={`h-full ${Platform.OS === 'android' ? 'mb-[40px]' : 'mb-[10px]'}`}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View className="h-[1px] mx-auto w-full bg-gray_strong" />}
              renderItem={({ item }) => {
                console.log(item, "item")
                return    <View className="py-3">
                  <CustomTouchableOpacity
                    classes="p-0 w-full"
                    type="transparent"
                    onPress={() => goToServiceHistory(item)}
                  >
                    <View className="w-full flex-1 flex-row justify-between items-center">
                      <View className="flex-1 flex-row items-center w-[90%] space-x-4">
                        <View className="h-full flex-row w-16 items-center">
                          <View className="h-10 w-10 z-[1] border-2 border-strongest rounded-full overflow-hidden">
                            {item?.customer?.avatar?.small ? (
                              <Image
                                src={item?.customer?.avatar?.small}
                                source={{ uri: item?.customer?.avatar?.small }}
                                className="w-full h-full object-cover object-center"
                              />
                            ) : (
                              <UserAvatarIcon />
                            )}
                          </View>
                          <View className="h-10 w-10 rounded-full flex items-center justify-center bg-strongest relative -left-5">
                            <Feather name="tool" size={22} color={Colors.secondary} />
                          </View>
                        </View>

                        <View className="flex-1">
                          <CustomText size="medium" color="strongest" boldness="bolder" numberOfLines={1}>
                            {item?.service_type?.name || t('services.service.no_area')}
                          </CustomText>
                          <CustomText size="small" color="gray_strong" boldness="bold" numberOfLines={1}>
                            {item?.customer?.name|| t('services.service.no_area')}
                          </CustomText>
                          <CustomText size="extraSmall" color="gray_medium" boldness="semiBold" numberOfLines={1}>
                            {renderDate(item.created_at)}
                          </CustomText>
                        </View>
                      </View>

                      <CustomText size="medium" color="primary" boldness="bold">
                        {renderMoney(item?.amount_for_vendor || null) || t('wallet.service.no_price_provided')}
                      </CustomText>
                    </View>
                  </CustomTouchableOpacity>
                </View>
              }}
              ListEmptyComponent={() => (
                <View className="py-8">
                  <CustomText
                    size="medium"
                    color="strongest"
                    boldness="semiBold"
                    numberOfLines={1}
                    classes="text-center"
                  >
                    {t('services.no_services_found')}
                  </CustomText>
                </View>
              )}
              ListFooterComponent={() => {
                if (haveMoreServicesHistory) {
                  return (
                    <View className="mt-2 py-2">
                      <CustomTouchableOpacity
                        size="large"
                        type="primary"
                        text={t('services.history.load_more')}
                        textBoldness="semiBold"
                        textColor="secondary"
                        onPress={() => getHistoryServices()}
                      />
                    </View>
                  )
                } else {
                  return undefined
                }
              }}
            />
          )
        }
      </View>
    </SafeAreaView>
  )
}

export default History
