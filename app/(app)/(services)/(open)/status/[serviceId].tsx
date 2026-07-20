import { Colors } from '@/constants/Colors';
import { Entypo, Feather, FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHandler, Image, ScrollView, View, Text } from 'react-native';
import BackHeader from '@/components/app/BackHeader';
import { useSession } from '@/contexts/SessionContext';
import { CustomText } from "@/components/CustomText";
import { useService } from "@/contexts/ServiceContext";
import IDomParser from "advanced-html-parser";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import ChatIcon from "@/assets/icons/chat";
import LocationIcon from "@/assets/icons/location";
import CheckMark from "@/assets/icons/check-mark";
import CircledCheckMark from "@/assets/icons/circled-check-mark";
import { router } from "expo-router";
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { useDialog } from "@/contexts/DialogContext";
import XIcon from "@/assets/icons/x";
import { ServiceStatus } from "@/types/services";
import { useTranslation } from "react-i18next";
import UserAvatarIcon from "@/assets/icons/user-avatar";
import { renderMoney } from "@/utils/money";
import CircledCheckMarkFilled from "@/assets/icons/circled-check-mark-1";
import CircledX from "@/assets/icons/circled-x-mark-1";

interface Details{
  includes: string[];
  excludes: string[];
};

const JobDetail = ({ label, value }: {label: string, value: string}) => (
  <View className="flex-row justify-between items-center">
    <CustomText color="gray_medium" boldness="semiBold" classes="w-[50%]" numberOfLines={1}>
      {label}
    </CustomText>
    <View className="items-end w-[48%]">
      <CustomText color="secondary" size="large" boldness="semiBold" numberOfLines={1}>
        {value}
      </CustomText>
    </View>
  </View>
);

const Action = ({ Icon, label, onPress, disabled, badge }: {Icon: React.FC, label: string, onPress: () => void, disabled: boolean, badge?: number}) => {
  return (
    <CustomTouchableOpacity
      classes="w-24 flex items-center justify-start h-full max-h-32"
      onPress={onPress}
      disabled={disabled}
    >
      <View className="flex flex-col items-center space-y-2">
        <View className="bg-gray_strong rounded-lg h-14 w-14 p-4 flex items-center justify-center relative">
          <Icon />
          {badge !== undefined && badge > 0 && (
            <View className="bg-error rounded-full h-5 w-5 flex items-center justify-center absolute -top-2 -right-2">
              <CustomText size="extraSmall" boldness="bold" color="secondary">
                {badge > 9 ? '9+' : badge}
              </CustomText>
            </View>
          )}
        </View>

        <CustomText size="extraSmall" boldness="semiBold" color="secondary" classes="text-center" numberOfLines={1}>
          {label}
        </CustomText>
      </View>
    </CustomTouchableOpacity>
  )
}

const Status = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData } = useSession();
  const { openService, setOpenService, unreadMessages, clearUnreadMessages } = useService();
  const { openDialog } = useDialog();
  const [loadingFinishService, setLoadingFinishService] = useState(false);
  const [ servicesDetail, setServicesDetail] = useState<Details>({ includes: [], excludes: []})

  const desc = (text: string) => {
    if (text[0] !== "<") return text;
    try {
      const parsed = IDomParser.parse(text);
      return parsed.documentElement?.textContent;
    } catch (error) {
      return text;
    }
  };

  const finishService = async () => {
    setLoadingFinishService(true);
    api.post(API_ROUTES.POST_FINISH_SERVICE(`${openService?.id}`))
      .then(({ data }) => {
        if (data.data.service) setOpenService(data.data.service);
        openDialog({
          icon: <CheckMark color={Colors.primary} />,
          title: t('services.service.finish.title'),
          subtitle: t('services.service.finish.subtitle'),
          closeAfterMSeconds: 5000,
          closeOnClickOutside: true,
          onClose: () => {
            router.dismissAll();
          }
        })
      })
      .catch((error) => {
        // console.log({error});
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        })
      })
      .finally(() => {
        setLoadingFinishService(false);
      })
  }

  const handleFinishService = () => {
    openDialog({
      title: t('services.service.finish.confirmation.title'),
      subtitle: t('services.service.finish.confirmation.subtitle'),
      successButtonText: t('services.service.finish.confirmation.confirm'),
      cancelButtonText: t('services.service.finish.confirmation.cancel'),
      onSuccess: () => finishService(),
    })
  };


  const isObj = (item: any) => {
    if (typeof item === "object" && !Array.isArray(item) && item !== null) {
      return true;
    } else return false;
  };


  const getOperationAreas = async (): Promise<void> => {
    api
      .post(API_ROUTES.POST_SEARCH_OPERATION_AREAS, {})
      .then((response) => {
        const { data } = response?.data || {};

        if (data?.services_types && Array.isArray(data?.services_types)) {
          let filtered: any = data?.services_types?.filter(
            (elem: any) => elem?.id === openService?.service_type?.id
            // (elem: any) => elem?.id === 85 //mock for test purposes
          );

          if (Array.isArray(filtered) && filtered.length > 0) {

            let included: string[] = [];
            let excluded: string[] = [];

            if (isObj(filtered[0]) &&
                filtered[0]?.hasOwnProperty("excludes") &&
                filtered[0]?.hasOwnProperty("includes"))
            {
              if(Array.isArray(filtered[0].includes)){
                filtered[0].includes.map((inc: any )=> {
                  if(typeof inc === 'string'){
                    included.push(inc);
                  }
                })
              }
              if(Array.isArray(filtered[0].excludes)){

                filtered[0].excludes.map((exc: any )=> {
                  if(typeof exc === 'string'){
                    excluded.push(exc);
                  }
                })
              }
            }


            setServicesDetail({...servicesDetail, includes: included, excludes: excluded});

          }
        }
      })
      .catch((error) => {
        if (error?.response?.status !== 401) {
           openDialog({
             icon: <XIcon color={Colors.secondary} />,
             title: t("errors.title"),
             subtitle: t("errors.occurred_an_error"),
             closeAfterMSeconds: 2000,
             closeOnClickOutside: true,
           });
        }
      })
      .finally(() => {});
  };




  useEffect(() => {
    const handleOperationAreas = async () => {
      // setLoadingOperationAreas(true);
      await getOperationAreas();
      // setLoadingOperationAreas(false);
    }
    handleOperationAreas();
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {/* <StatusBar backgroundColor={Colors.primary} style="light" animated /> */}
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <View className="flex flex-row items-center">
            <CustomText color="secondary" boldness="medium" numberOfLines={1}>
              {t('services.service.status.header')}
            </CustomText>
          </View>
        )}
        // rigthItem={() => (
        //   <View className="flex items-end">
        //     <Feather name="help-circle" size={30} color={Colors.secondary} />
        //   </View>
        // )}
        otherClasses="px-5 py-4"
      />
      <ScrollView className="flex-1 px-5 space-y-8">
        <View className="items-center space-y-2 my-6">
          <View className="relative flex items-center justify-center h-14 w-14 mx-auto rounded-full overflow-hidden">
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
          <View>
            <CustomText color="secondary" boldness="semiBold" size="medium" numberOfLines={1} classes="text-center">
              {openService?.customer?.name}
            </CustomText>
            <CustomText color="gray_medium" boldness="regular" size="small" numberOfLines={2} classes="text-center">
              {openService?.address?.name}

            </CustomText>
            {openService?.address?.additional_info && (
              <CustomText color="gray_medium" boldness="regular" size="small" numberOfLines={2} classes="text-center">
                {openService?.address?.additional_info}
              </CustomText>
            )}
          </View>
        </View>

        <View className="my-2">
          <View className="mt-4">
            {openService?.service_type?.name && (
              <CustomText color="support_primary" boldness="semiBold" size="medium" numberOfLines={2} classes="text-center">
                {openService?.service_type?.name}
              </CustomText>
              )}
            {/* <CustomText color="gray_medium" boldness="regular" size="small" numberOfLines={2} classes="text-center">
              {desc(openService?.service_type?.description || "")}
            </CustomText> */}
          </View>
        </View>


        <View className="justify-end items-center space-y-1">
            <View className="flex-row w-full">
              <CustomText color="secondary" boldness="semiBold" size="small">{t('services.includes')}</CustomText>
            </View>
               { servicesDetail && servicesDetail?.includes &&
                  Array.isArray(servicesDetail?.includes) && servicesDetail.includes?.length > 0 ?
                  servicesDetail?.includes.map((item: any, i: number) => {
                      return <View className="flex-row w-full" key={i}>
                               <View className="flex-[1]" style={{ width: 18, height: 18 }}>
                                  <CircledCheckMarkFilled color="#FFFFFF" background="lime"/>
                                </View>

                                <View className="flex-[9]">
                                  { typeof item === 'string' && <CustomText color="secondary" boldness="regular" size="small">{item}</CustomText> ||
                                  <CustomText color="secondary" boldness="regular" size="small">{t('services.no_info')}</CustomText>}
                                </View>
                              </View>
                  }) :        <View className="flex-row w-full">
                                <Text style={{color: 'white'}}>{t('services.no_info')}</Text>
                              </View>

              }

             <View className="flex-row w-full">
                <CustomText className='mt-4' color="secondary" boldness="semiBold" size="small">{t('services.excludes')}</CustomText>
             </View>
              { servicesDetail && servicesDetail?.excludes &&
                Array.isArray(servicesDetail?.excludes) && servicesDetail?.excludes?.length > 0 ?
                servicesDetail?.excludes.map((item: any, i: number) => {
                    return <View className="flex-row w-full" key={i}>
                              <View className="flex-[1]" style={{ width: 22, height: 22 }}>
                                <CircledX color="red" />
                              </View>
                              <View className="flex-[9]">
                                  { typeof item === 'string' && <CustomText color="secondary" boldness="regular" size="small">{item}</CustomText> ||
                                  <CustomText color="secondary" boldness="regular" size="small">{t('services.no_info')}</CustomText>}
                                </View>
                            </View>
                            })
                            : <View className="flex-row w-full">
                                <Text style={{color: 'white'}}>{t('services.no_info')}</Text>
                              </View>
               }

        </View>


      </ScrollView>
      <View className="flex-row items-center justify-evenly flex-wrap p-5">
        <Action
          Icon={() => <ChatIcon color={Colors.support_primary} />}
          label={t('services.service.status.chat')}
          onPress={() => {
            clearUnreadMessages();
            router.dismissTo(`/(app)/(services)/(open)/(chat)/service/${openService?.id}`);
          }}
          disabled={loadingFinishService}
          badge={unreadMessages}
        />
        {/* <Action
          Icon={() => <LocationIcon color={Colors.support_primary} />}
          label="Map"
          onPress={() => {}}
        />
        */}
        {(
          openService?.status === ServiceStatus.ACCEPTED ||
          openService?.status === ServiceStatus.ARRIVED
        ) && (
          <Action
            Icon={() => <XIcon color={Colors.support_primary} />}
            label={t('services.service.open.cancel')}
            onPress={() => {
              router.push(`/(app)/(services)/(open)/cancel/${openService?.id}`);
            }}
            disabled={loadingFinishService}
          />
        )}
        {openService?.status !== ServiceStatus.FINISHED  && (
          <Action
            Icon={() => <CircledCheckMark color={Colors.support_primary} />}
            label={t('services.service.status.finish')}
            onPress={() => {
              handleFinishService();
            }}
            disabled={loadingFinishService || openService?.status !== ServiceStatus.ARRIVED}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

export default Status;
