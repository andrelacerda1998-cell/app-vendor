import React from "react";
import UserAvatarIcon from "@/assets/icons/user-avatar";
import {View, SafeAreaView, Platform, Image, TouchableOpacity} from "react-native";
import {useRouter} from "expo-router";
import MyProfile from "@/components/app/Profile/MyProfile";
import { CustomText } from "@/components/CustomText";
import BackHeader from "@/components/app/BackHeader";
import { useTranslation } from "react-i18next"
import {Feather} from "@expo/vector-icons";
import {Colors} from "react-native/Libraries/NewAppScreen";
import { useSession } from "@/contexts/SessionContext";

const UserProfile = () => {
  const { vendorData, isLoadingUserData } = useSession();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView
      className={`flex-1 ${
        Platform.OS === "ios" && "h-full"
      } bg-support_secondary p-5 bg-primary flex-1`}
    >
      <View className="mt-4 p-5 mb-5">
        <BackHeader
          backButtonColor="secondary"
          middleItem={() => (
            <CustomText color="secondary" boldness="bold" numberOfLines={1}>
             {t('profile.my_profile.title')}
            </CustomText>
          )}
          rigthItem={() => (
              <TouchableOpacity
                  onPress={() => router.push("/(app)/(modals)/(profile)/edit-profile")}
              >
                <Feather name="edit-2" size={22} color={"#ffffff"} />
              </TouchableOpacity>
          )}
          otherClasses="pb-5 mt-5"
        />
      </View>
      <View
        className="justify-center mb-8"
        style={{
          flex: 0.8,
        }}
      >
        <View className="relative flex items-center justify-center h-20 w-20 mx-auto border-4 border-secondary rounded-full overflow-hidden">
          {isLoadingUserData ? (
            <View className="absolute z-10 rounded-full overflow-hidden w-full h-full">
              <View className="w-full h-full bg-gray_light"></View>
            </View>
          ) : (
            <View className="absolute z-10 rounded-full overflow-hidden w-full h-full">
              {vendorData?.avatar?.src ? (
                <Image
                  src={vendorData?.avatar?.src}
                  source={{ uri: vendorData?.avatar?.src }}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <UserAvatarIcon />
              )}
            </View>
          )}
        </View>
        <View className={`${Platform.OS === "ios" ? "mt-3" : "mt-4"} mx-auto`}>
          <CustomText
            size="large"
            boldness="semiBold"
            color="secondary"
            className="text-center"
          >
            {vendorData?.username}
          </CustomText>
          <CustomText size="small" color="gray_medium" className="text-center">
            {vendorData?.user?.email}
          </CustomText>
        </View>
      </View>

      <MyProfile vendorData={vendorData} />
    </SafeAreaView>
  );
};
export default UserProfile;
