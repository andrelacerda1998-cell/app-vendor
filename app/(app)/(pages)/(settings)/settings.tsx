import React, { useState } from "react";
import { View, SafeAreaView, Platform } from "react-native";
import SettingsElement from "@/components/app/Profile/Settings";
import { CustomText } from "@/components/CustomText";
import BackHeader from "@/components/app/BackHeader";
import { useTranslation } from "react-i18next"

const Settings = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView
      className={`flex-1 ${
        Platform.OS === "ios" && "h-full"
      } bg-support_secondary p-5 bg-primary flex-1`}
    >      
      <View className="mt-4 p-5">
        <BackHeader
          backButtonColor="secondary"
          middleItem={() => (
            <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
             {t('profile.my_profile.labels.settings')}
            </CustomText>
          )}
          otherClasses="mt-5"
        />
      </View>
        <View className="justify-center h-[90%]">   
         <SettingsElement /> 
       </View>            
    </SafeAreaView>
  );
};
export default Settings;
