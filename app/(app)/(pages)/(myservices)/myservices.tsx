import React, { useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useService } from "@/contexts/ServiceContext";
import { useTranslation } from "react-i18next";
import { CustomText } from '@/components/CustomText';
import BackHeader from "@/components/app/BackHeader";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import OperationAreaCardCounter from "@/components/OperationAreaCardCounter";
import { Colors } from '@/constants/Colors';
import BoltSm from "@/assets/icons/boltsm";

interface MyServicesProps{}


const MyServices: React.FC<MyServicesProps> = () => {
const { t } = useTranslation();
const { myOperationAreas} = useService();

const [isLoading, setIsLoading] = useState({
       wallet: false,
       operationAreas: false,
       vendorStatus: false
});

  return (
       <SafeAreaView className={`pt-5 h-full relative bg-strongest ${Platform.OS === 'android' ? 'pb-[100px]' : 'pb-[50px]'}`}>
               <View className="px-3 bg-strongest rounded-b-3xl">
                     <BackHeader
                            backButtonColor="secondary"
                            middleItem={() => (
                              <CustomText color="secondary" boldness="bold" numberOfLines={1}>
                                {t('profile.my_profile.labels.my_services')}
                              </CustomText>
                            )}
                            otherClasses="pb-5 mt-5"
                     />
                  <ScrollView className="flex-grow-0">
                      <View className="py-2 flex-1">
                            <View className="flex-row items-center justify-between px-3">
                                   <CustomText size="large" color="secondary" boldness="medium" numberOfLines={1} classes="text-lg w-[60%]">
                                          {t('home.my_areas')}
                                   </CustomText>
                                   <CustomTouchableOpacity
                                          type="transparent"
                                          size="small"
                                          classes="p-0"
                                          onPress={() => {
                                          router.push('/(app)/(bottom-sheets)/areas');
                                          }}
                                   >
                                          <CustomText size="extraSmall" color="gray_light" boldness="medium" numberOfLines={1}>
                                          {t('home.my_areas_change')}
                                          </CustomText>
                                   </CustomTouchableOpacity>
                     </View>

                            {isLoading.operationAreas ? (
                            <View className="flex-1">
                                   <View className="pt-4 px-3 items-center space-y-4">
                                   {
                                          Array.from({ length: 5 }).map((_, index) => (
                                                 <View key={`loading-opa-${index}`} className="w-full rounded-xl overflow-hidden h-16 relative">
                                                        <View className="w-full h-full bg-[#111215]"></View>
                                                        <View className="absolute top-3 left-3 h-10 w-10 rounded-full overflow-hidden">
                                                        <View className="w-full h-16 bg-[#272727]"></View>
                                                 </View>

                                                 <View className="absolute top-3 left-14 w-[45%] items-center p-3 rounded-full overflow-hidden">
                                                         <View className="w-full h-5 bg-[#272727] rounded-full"></View>
                                                 </View>
                                                 </View>
                                          ))
                                   }
                                   </View>
                            </View>
                            ) : (
                            myOperationAreas && myOperationAreas.length > 0 ? (
                                   <View className="px-3 flex-1 space-y-4 pt-4">
                                   {
                                   myOperationAreas.slice(0,5).map((operationArea) => {
                                   if (!operationArea?.services_types_subscribed || operationArea?.services_types_subscribed.length === 0) {
                                          return null;
                                   }

                                          return (
                                          <View className="w-full" key={operationArea.id}>
                                                 <OperationAreaCardCounter
                                                        Icon={() => <BoltSm color={Colors.support_primary} size={18} filled={false}/>}
                                                        label={operationArea.name}
                                                        count={operationArea?.services_types_subscribed?.length}
                                                 />
                                          </View>
                                          )
                                   })}
                                   </View>
                            ) : (
                                   <View className="px-3 pt-4">
                                          <CustomText size="small" color="gray_medium" numberOfLines={1}>
                                          {t('home.my_areas_empty')}
                                          </CustomText>
                                   </View>
                            )
                            )}
                     </View>
                  </ScrollView>   
               </View>       
       </SafeAreaView>
  )
} 

export default MyServices;