import React from "react";
import {View, SafeAreaView, Platform, TouchableOpacity} from "react-native";
import {useRouter} from "expo-router";
import Payment from "@/components/app/Profile/Payment";
import BackHeader from "@/components/app/BackHeader";
import { CustomText } from "@/components/CustomText";
import { useTranslation } from "react-i18next"
import {Feather} from "@expo/vector-icons";
import { useSession } from "@/contexts/SessionContext";

const Payments = () => {
  const { vendorData } = useSession();
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
             {t('profile.my_profile.labels.payments')}
            </CustomText>
          )}
          otherClasses="pb-5 mt-5"
          rigthItem={() => (
              <TouchableOpacity
                  onPress={() => router.push("/(app)/(modals)/(profile)/edit-payment")}
              >
                <Feather name="edit-2" size={22} color={"#ffffff"} />
              </TouchableOpacity>
          )}
        />
      </View>
      <View className="justify-center mb-8">
         <Payment vendorData={vendorData} />
      </View>
    </SafeAreaView>
  );
};
export default Payments;
