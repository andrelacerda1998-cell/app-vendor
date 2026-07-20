import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, TouchableWithoutFeedback, useAnimatedValue, View } from 'react-native'
import { ThemedText } from '../ThemedText'
import { Colors } from '@/constants/Colors'
import { Entypo, Feather, MaterialIcons, Octicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import TouchOpacity from '../TouchOpacity'
import * as Location from 'expo-location';
import { Alert } from 'react-native'
import { useApi } from '@/contexts/ApiContext'
import { useClickOutside } from 'react-native-click-outside'
import { API_ROUTES } from '@/constants/ApiRoutes'
import { useSession } from '@/contexts/SessionContext'
import { CustomText } from '../CustomText'
import Notification from '@/assets/icons/notification'
import NotificationIcon from "@/assets/icons/notification"
import { useTranslation } from "react-i18next"

const UserHeader = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const dropDownRef = useClickOutside<View>(() => {
    toggleShowDropdown();
  });
  const { vendorData, setVendorData } = useSession();
  const [locationConsentStatus, setLocationConsentStatus] = useState<PermissionStatus>();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);

  const [notifications, setNotifications] = useState<number>(0);

  useEffect(() => {
    if (vendorData?.user?.notifications !== undefined) {
      setNotifications(vendorData?.user?.notifications)
    }
  }, [vendorData?.user?.notifications]);

  useEffect(() => {
    (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        // @ts-ignore
        setLocationConsentStatus(status);
        if (status !== 'granted') {
            // todo not have permission
            return;
        }
    })();
  }, []);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: showDropdown ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showDropdown]);

  const toggleShowDropdown = () => {
    setShowDropdown(prev => !prev);
  }

  // const rotate = rotateAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: ['0deg', '-180deg'],
  // });

  // const manageProfilePress = () => {
  //   toggleShowDropdown();
  //   router.navigate("/(app)/profile");
  // };

  // const goToChangeSkills = () => {
  //   router.navigate("/(app)/(modals)/(skills)/change-skills");
  // }

  // const handleSetCurrentLocation = async () => {
  //   if (locationConsentStatus?.state === "denied"){
  //       Alert.alert('Location denied');
  //       return;
  //   }

  //   let location = await Location.getCurrentPositionAsync({});

  //   updateLocation(location.coords.latitude, location.coords.longitude);
  // }

  // const updateLocation = (latitude: number, longitude: number) => {
  //   setIsLoadingRequest(true);
  //   api.put(API_ROUTES.VENDOR_UPDATE_LOCATION, {
  //       latitude,
  //       longitude
  //   }).then((response)=>{
  //     const { current_location } = response.data.data;
  //     const newVendorData = {
  //       ...vendorData,
  //       current_location
  //     }
  //     setVendorData(newVendorData);
  //   }).catch(err=>{
  //       console.log(err);
  //   }).finally(()=>{
  //       setIsLoadingRequest(false);
  //   })

  // }

  // const changeVendorStatus = (newStatus: string) => {
  //   setIsLoadingRequest(true);
  //   const newStatusValue = newStatus.at(0)?.toUpperCase() + newStatus.slice(1);
  //   api.put(API_ROUTES.VENDOR_UPDATE_STATUS, {
  //     status: newStatusValue
  //   }).then((data)=>{
  //     console.log({data}, 'data on changeVendorStatus on vendor user header')
  //     console.log("Change vendor status");
  //     const newStatusData = {
  //       ...vendorData,
  //       status: newStatusValue as "Online" | "Offline"
  //     }
  //     setVendorData(newStatusData);
  //   }).catch(err=>{
  //     console.log(err);
  //   }).finally(()=>{
  //     setIsLoadingRequest(false);
  //   })
  // }

  const handlePressNotification = () => {
    router.push('/(app)/(modals)/notifications')
  }

  return (
    <View>
      <View className="flex-row items-center justify-between w-full">
        {/* <TouchOpacity bgColor="primary" itemsCenter otherClasses="px-6 py-2" rounded="full" onPress={goToChangeSkills}>
          <ThemedText type="default" className="font-poppins-medium" color={Colors.support_primary}>
            My skills
          </ThemedText>
        </TouchOpacity> */}

        <CustomText size="small" color="gray_medium" numberOfLines={1} classes="w-[80%]">
          {t('user_header.welcome_back')}
          <CustomText size="small" color="secondary">{" "}{vendorData?.user?.first_name}</CustomText>
        </CustomText>

        <TouchOpacity onPress={handlePressNotification} className="w-6 h-6">
          <NotificationIcon color={Colors.secondary} />
          {
              notifications > 0 && (
                  <View
                      className={`
                  bg-secondary rounded-full h-5 w-5 flex items-center justify-center
                  absolute -top-3 -right-2
                `}
                  >
                    <CustomText
                        size="extraSmall"
                        boldness="bold"
                        color="support_secondary"
                    >
                      {notifications}
                    </CustomText>
                  </View>
              )
          }
        </TouchOpacity>

        {/* <View className="flex-row items-center justify-center">
          <TouchOpacity
            onPress={() => {
              if (!showDropdown) {
                toggleShowDropdown()
              }
            }}
          >
            <View className="flex-row items-center">
              <View className="relative">
                <View className="h-10 w-10 rounded-full overflow-hidden mr-2">
                  <Image
                    src="https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp"
                    source={{ uri: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp' }}
                    className="w-full h-full object-cover object-center"
                  />
                </View>
                <View className={`h-3 w-3 rounded-full ${vendorData?.status === "Online" ? "bg-success" : "bg-gray_light"} absolute right-2 bottom-0`}></View>
              </View>

              <Animated.View
                style={{
                  transform: [{ rotate }],
                }}
              >
                <Entypo name="chevron-down" size={24} color="black" />
              </Animated.View>
            </View>

          </TouchOpacity>
        </View> */}
      </View>
      {/* {
        showDropdown && (
          <View className="bg-primary right-0 p-4 shadow-2xl shadow-dark absolute top-10 mt-2 rounded-xl space-y-3 z-[1]" ref={dropDownRef}>
            <ThemedText color={Colors.gray_medium} type="small">
              Change status
            </ThemedText>
            {vendorData?.status === "Online" ? (
              <TouchOpacity className="flex-row items-center" onPress={() => changeVendorStatus("Offline")} disabled={isLoadingRequest}>
                <View className="h-2 w-2 rounded-full bg-gray_light mr-2"></View>
                <ThemedText color={isLoadingRequest ? Colors.gray_medium : Colors.secondary} type="default">
                  Offline
                </ThemedText>
              </TouchOpacity>
            ) : (
              <TouchOpacity className="flex-row items-center" onPress={() => changeVendorStatus("Online")} disabled={isLoadingRequest}>
                <View className="h-2 w-2 rounded-full bg-success mr-2"></View>
                <ThemedText color={isLoadingRequest ? Colors.gray_medium : Colors.secondary} type="default">
                  Online
                </ThemedText>
              </TouchOpacity>
            )}

            <View className="bg-gray_medium w-full h-[1px] rounded-full"></View>

            <TouchOpacity className="flex-row items-center" onPress={manageProfilePress}>
              <Feather name="user" size={18} color={Colors.secondary}/>
              <ThemedText color={Colors.secondary} type="default" className="ml-2">
                Manage Profile
              </ThemedText>
            </TouchOpacity>
            <View className="flex-row items-center">
              <MaterialIcons name="logout" size={18} color={Colors.error} />
              <ThemedText color={Colors.error} type="defaultSemiBold" className="ml-2">
                Log Out
              </ThemedText>
            </View>
          </View>
        )
      } */}

      {/* <TouchOpacity bgColor="primary" itemsCenter otherClasses="px-6 py-2 w-1/2 mt-6" rounded="full"
        onPress={handleSetCurrentLocation}
      >
        <ThemedText type="default" className="font-poppins-medium" color={Colors.support_primary}>
          Change location
        </ThemedText>
      </TouchOpacity>
      <ThemedText color={Colors.primary} className="mt-2">
        Location: {vendorData?.current_location?.latitude}, {vendorData?.current_location?.longitude}
      </ThemedText> */}
    </View>
  )
}

export default UserHeader
