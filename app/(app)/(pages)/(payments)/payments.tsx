import React from "react";
import { SafeAreaView, TouchableOpacity } from "react-native";
import {useRouter} from "expo-router";
import Payment from "@/components/app/Profile/Payment";
import BackHeader from "@/components/app/BackHeader";
import { CustomText } from "@/components/CustomText";
import { useTranslation } from "react-i18next"
import {Feather} from "@expo/vector-icons";
import { useSession } from "@/contexts/SessionContext";
import { Colors } from '@/constants/Colors';

const Payments = () => {
  const { vendorData } = useSession();
  const { t } = useTranslation();
  const router = useRouter();

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
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
           {t('profile.my_profile.labels.payments')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
        rigthItem={() => (
            <TouchableOpacity
                onPress={() => router.push("/(app)/(modals)/(profile)/edit-payment")}
            >
              <Feather name="edit-2" size={22} color={Colors.secondary} />
            </TouchableOpacity>
        )}
      />
      <Payment vendorData={vendorData} />
    </SafeAreaView>
  );
};
export default Payments;
