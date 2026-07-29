import React from "react";
import UserAvatarIcon from "@/assets/icons/user-avatar";
import {View, SafeAreaView, Platform, Image, TouchableOpacity} from "react-native";
import {useRouter} from "expo-router";
import MyProfile from "@/components/app/Profile/MyProfile";
import { CustomText } from "@/components/CustomText";
import BackHeader from "@/components/app/BackHeader";
import { useTranslation } from "react-i18next"
import {Feather} from "@expo/vector-icons";
import {Colors} from "@/constants/Colors";
import { useSession } from "@/contexts/SessionContext";

const UserProfile = () => {
  const { vendorData, isLoadingUserData } = useSession();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView
      className={`flex-1 ${
        Platform.OS === "ios" && "h-full"
      } bg-bg flex-1`}
    >
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
        otherClasses="px-5 py-4"
      />

      <View className="px-5 pb-6 items-center">
        <View
          className="relative flex items-center justify-center h-20 w-20 rounded-full overflow-hidden border"
          style={{ borderColor: Colors.line, backgroundColor: Colors.card_high }}
        >
          {isLoadingUserData ? (
            <View className="absolute z-10 rounded-full overflow-hidden w-full h-full">
              <View className="w-full h-full" style={{ backgroundColor: Colors.card_high }}></View>
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
        <View className={Platform.OS === "ios" ? "mt-3 items-center" : "mt-4 items-center"}>
          <CustomText
            size="large"
            boldness="semiBold"
            color="secondary"
            classes="text-center"
            numberOfLines={1}
          >
            {vendorData?.user?.first_name || vendorData?.username}
          </CustomText>
          <CustomText size="small" color="muted" classes="text-center" numberOfLines={1}>
            {vendorData?.user?.email}
          </CustomText>
        </View>
      </View>

      <MyProfile vendorData={vendorData} />
    </SafeAreaView>
  );
};
export default UserProfile;
