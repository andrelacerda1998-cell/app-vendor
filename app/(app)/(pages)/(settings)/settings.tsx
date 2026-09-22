import React from "react";
import { SafeAreaView } from "react-native";
import SettingsElement from "@/components/app/Profile/Settings";
import { CustomText } from "@/components/CustomText";
import BackHeader from "@/components/app/BackHeader";
import { useTranslation } from "react-i18next"
import { Colors } from '@/constants/Colors';

const Settings = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView
      /*
       * `flex: 1` no `style` e nao no `className`.
       *
       * O `SafeAreaView` do react-native nao passa pelo NativeWind v4: o
       * `className` e aceite sem erro e ignorado em silencio. Sem altura, um
       * `ScrollView` filho fica com zero e o ecra aparece completamente
       * vazio — foi o que aconteceu as Definicoes e aos Pagamentos.
       */
      style={{ flex: 1, backgroundColor: Colors.bg }}
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
