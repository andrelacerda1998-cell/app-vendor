import React from "react";
import { SafeAreaView, Platform } from "react-native";
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
      } bg-bg flex-1`}
    >
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
           {t('profile.my_profile.labels.settings')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />
      <SettingsElement />
    </SafeAreaView>
  );
};
export default Settings;
