import XIcon from "@/assets/icons/x"
import { CustomText } from "@/components/CustomText"
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import DynamicSizingSheet from "@/components/sheets/DynamicSizingSheet"
import { API_ROUTES } from "@/constants/ApiRoutes"
import { Colors } from "@/constants/Colors"
import { useApi } from "@/contexts/ApiContext"
import { useDialog } from "@/contexts/DialogContext"
import { PaymentHistoryInterface } from "@/types/wallet"
import { renderMoney } from "@/utils/money"
import { Entypo, MaterialIcons } from "@expo/vector-icons"
import { router, useFocusEffect } from "expo-router"
import React, { useCallback, useState } from 'react'
import { useTranslation } from "react-i18next"
import { FlatList, Image, TouchableOpacity, View, Platform } from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"

const Wallet = () => {
  const { t } = useTranslation()
  const { api } = useApi()
  const { openDialog } = useDialog()
  const [transactions, setTransactions] = useState<PaymentHistoryInterface[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [haveMoreTransactions, setHaveMoreTransactions] = useState(true)

  useFocusEffect(
    useCallback(() => {
      getPaymentsHistory(0)
    }, [])
  )

  const getPaymentsHistory = async (offset?: number) => {

    // setPayments(response.data.data)

    // console.log({res}, 'payments history')

    if (!loadingTransactions) setLoadingTransactions(true)

    try {
      const { data } = await api.post(API_ROUTES.POST_PAYMENTS_HISTORY, {
        offset: offset ?? transactions.length
      })

      setHaveMoreTransactions(!!data.data.have_more)

      setTransactions(data.data.transactions)

    } catch(e) {
      openDialog({
        icon: <XIcon color={Colors.primary}/>,
        title: t('errors.title'),
        subtitle: t('errors.occurred_an_error'),
        closeAfterMSeconds: 2000,
        closeOnClickOutside: true,
      })
      // console.log({e}, 'error getting payments history')
    } finally {
      setLoadingTransactions(false)
    }

  }

  const renderDate = (date: string) => {
    const parsedDate = new Date(date)
    const month = parsedDate.toLocaleString('default', { month: 'short' });
    return `${parsedDate.getDate()} ${month} ${parsedDate.getFullYear()}`
  }

  const handlePress = (item: PaymentHistoryInterface) => {
    router.navigate({
      pathname: '/(app)/(bottom-sheets)/(wallet)/history',
      params: { history: JSON.stringify(item) }
    });
  }

  const getMoneyColor = (type: 'deposit' | 'withdraw') => {
    if (type === 'deposit') {
      return 'success';
    } else if (type === 'withdraw') {
      return 'error';
    }
    return 'success'; // Default color
  }

  return (
    <SafeAreaView className={`h-full bg-strongest ${Platform.OS === 'android' ? 'pb-[100px]' : 'pb-[50px]'}`}>
      {loadingTransactions && transactions.length === 0
        ? (
          <View className="flex-1 p-5">
            {Array.from({ length: 12 }).map((_, index) => (
              <View key={`skeleton-item-${index}`}>
                <View className="flex flex-row items-center space-x-4 bg-primary p-3 rounded-md">
                  <View className="rounded-full overflow-hidden w-12 h-12">
                    <View className="w-full h-full bg-gray_strong"></View>
                  </View>

                  <View className="flex-1 space-y-2">
                    <View className="rounded-xl overflow-hidden">
                      <View className="w-full h-4 bg-gray_strong"></View>
                    </View>
                    <View className="rounded-xl overflow-hidden">
                      <View className="w-full h-4 bg-gray_strong"></View>
                    </View>
                  </View>

                  <View className="items-center space-y-2">
                    <View className="w-12 h-5 rounded-md bg-gray_strong"></View>
                    <View className="w-10 h-4 rounded-full bg-gray_strong"></View>
                  </View>

                </View>
                <View className="h-[1px] mx-auto w-full bg-gray_strong my-4" />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(_, index) => index.toString()}
            style={{ paddingHorizontal: 20 }}
            showsVerticalScrollIndicator={false}
            className={"h-full"}
            // ItemSeparatorComponent={() => <View className="h-4 mx-auto w-full" />}
            renderItem={({ item }) => (

              <TouchableOpacity
                className="bg-primary rounded-md flex flex-row space-x-4 px-6 py-2 items-center my-2"
                // onPress={() => {
                //   router.push('/(app)/(bottom-sheets)/areas');
                // }}
                onPress={() => handlePress(item)}
              >
                <View className="relative bg-secondary flex items-center justify-center h-10 w-10 mx-auto rounded-full overflow-hidden">
                  <MaterialIcons name="attach-money" size={24} color={Colors.strongest} />
                </View>

                <View className="flex-1">
                  <CustomText color="secondary" size="medium" boldness="semiBold" numberOfLines={2}>
                    {item.service.description}
                  </CustomText>
                  <CustomText color="secondary" size="medium" boldness="light">
                    {renderDate(item.created_at)}
                  </CustomText>
                </View>

                <View className="items-end w-fit max-w-2">
                  <CustomText color={getMoneyColor(item.type as 'deposit' | 'withdraw')} size="medium" boldness="semiBold">
                    {renderMoney(item.amount)}
                  </CustomText>
                  <CustomText color="secondary" size="medium" boldness="light">
                    {item.type}
                  </CustomText>

                </View>

              </TouchableOpacity>

            )}
            ListEmptyComponent={() => (
              <View className="py-8">
                <CustomText
                  size="medium"
                  color="secondary"
                  boldness="semiBold"
                  classes="text-center"
                >
                  {t('payments.no_payments_found')}
                </CustomText>
              </View>
            )}
            ListFooterComponent={() => {
              if (haveMoreTransactions) {
                return (
                  <View className="mt-2 py-2">
                    <CustomTouchableOpacity
                      size="large"
                      type="secondary"
                      text={t('payments.load_more')}
                      textBoldness="semiBold"
                      textColor="primary"
                      onPress={() => getPaymentsHistory()}
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
    </SafeAreaView>
  )
}

export default Wallet
