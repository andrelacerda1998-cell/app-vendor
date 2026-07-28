import AdaptiveLogo from "@/assets/svgs/adptive-logo";
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { Colors } from "@/constants/Colors";
import {router} from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";

const App = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="py-6 w-full px-6 flex-1 bg-bg">
        <StatusBar backgroundColor={Colors.bg} style="light" />
        <View className="flex-1 items-center justify-center p-4">
          <View className="absolute bg-transparent border-[0.5px] border-support_primary w-60 h-60 rounded-[62px]"></View>
          <View className="absolute bg-transparent border border-support_primary w-44 h-44 rounded-[42px]"></View>
          <View className="bg-support_primary border-2 border-support_primary w-28 h-28 p-6 rounded-[22px] items-center justify-center">
            <AdaptiveLogo color={Colors.primary} />
          </View>
        </View>

        <CustomText
          size="title"
          color="secondary"
          boldness="bold"
        >
          {t('auth.home.title')}
        </CustomText>
        <CustomText
          size="medium"
          color="muted"
          boldness="regular"
          numberOfLines={5}
          classes="my-4"
        >
          {t('auth.home.subtitle')}
        </CustomText>
        <View className="mt-8">
          <CustomTouchableOpacity
            type="support_primary"
            size="large"
            text={t('auth.home.access_account')}
            textSize="default"
            textColor="on_brand"
            textBoldness="semiBold"
            onPress={() => {
              router.navigate('/(auth)/signin')
            }}
          />
          <CustomTouchableOpacity
            type="secondary_outline"
            size="large"
            text={t('auth.home.create_account')}
            textSize="default"
            textColor="support_primary"
            textBoldness="semiBold"
            onPress={() => {
              router.navigate('/(auth)/signup')
            }}
            classes="mt-4"
          />
        </View>
    </SafeAreaView>
  );
};

export default App;
