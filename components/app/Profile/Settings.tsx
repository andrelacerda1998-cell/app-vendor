import BackHeader from '@/components/app/BackHeader';
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { ThemedText } from '@/components/ThemedText';
import TouchOpacity from '@/components/TouchOpacity';
import { Colors } from '@/constants/Colors';
import { Entypo, Feather, Octicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useRef, Fragment } from 'react'
import { View, StatusBar, Image, Linking } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useRouter} from "expo-router";
import { useTranslation } from "react-i18next";
import packageInfo from '@/package.json';
import InfoSquareIcon from "@/assets/icons/info";
import PrivacyPolicy from "@/assets/icons/privacy";
import ClipNotebookIcon from "@/assets/icons/terms";
import TrashCanIcon from "@/assets/icons/delete";
import DocumentIcon from "@/assets/icons/documents";


const Settings = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const items = [
    {id: 3, label: t('profile.settings.documents'), onPress: () => router.push('/(app)/(modals)/documents'), icon:  (
        <View style={{ paddingLeft: 1 }}>
          <DocumentIcon size={20} color="#fff"/>
        </View>
      )},
    {id: 4, label: t('profile.settings.delete_account'), onPress: () => router.push('/(app)/(modals)/delete-account'), icon: (
        <View style={{ paddingLeft: 1 }}>
          <TrashCanIcon size={20} />
        </View>
    )},
  ]

  const footerOptions = [
    {id: 2, label: t('profile.settings.about'), onPress: () => Linking.openURL('https://piquetapp.com/#FAQ'), icon:  <View style={{ paddingLeft: 1 }}>
          <InfoSquareIcon size={24} color="#fff" color2="#000"/>
        </View>},
    {id: 3, label: t('profile.settings.privacy'), onPress: () => Linking.openURL('https://piquetapp.com/politica-de-privacidade-para-utilizadores/'), icon:  <View style={{ marginTop: 2 }}>
          <PrivacyPolicy width={24} height={24} color="#fff" />
        </View>
    },
    {id: 4, label: t('profile.settings.use_terms'), onPress: () => Linking.openURL('https://piquetapp.com/termos-condicoes-de-utilizacao-da-aplicacao/'), icon:  <View
          style={{
            paddingLeft: 1,
            marginBottom: 2,
          }}
        >
          <ClipNotebookIcon width={24} height={24} />
        </View>
    },
  ]

  // ref
  // const bottomSheetRef = useRef<BottomSheet>(null);

  // callbacks
  // const handleSheetChanges = useCallback((index: number) => {
  //   console.log('handleSheetChanges', index);
  // }, []);

  // renders
  return (
          <ScrollView
            className="px-5"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "space-between",
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          >
              <View>
                  {footerOptions.map((item, index) => (
                    <CustomTouchableOpacity
                      key={item.id}
                      onPress={item.onPress}
                      type="transparent"
                      size="small"
                      textColor="gray_strong"
                      textBoldness="regular"
                      className="w-full"
                    >
                    <View className="flex flex-row justify-between items-center h-6">
                      <View className="w-[1%] flex justify-center">{item.icon}</View>
                      <View className="w-[75%] flex justify-center">
                        <CustomText
                          color="secondary"
                          size="small"
                          numberOfLines={1}
                          boldness="regular"
                        >
                          {item.label}
                        </CustomText>
                      </View>
                      <View className="w-[10%] flex items-center">
                        <Entypo name="chevron-right" color={"#ffffff"} size={24} />
                      </View>
                    </View>
                    </CustomTouchableOpacity>
                  ))
                }

                <View className='mt-4'></View>
                  {items.map((item, index) => (
                    <CustomTouchableOpacity
                      size="small"
                      type="transparent"
                      key={item.id}
                      onPress={item.onPress}
                      className="w-full"
                    >
                      <View className="flex flex-row justify-between items-center">
                        <View className="w-[85%]">
                          <CustomText
                            color="secondary"
                            size="small"
                            numberOfLines={1}
                            boldness="regular"
                          >
                            {item.label}
                          </CustomText>
                        </View>
                        <View className="w-[10%] flex items-center">
                          {item.icon}
                        </View>
                      </View>
                    </CustomTouchableOpacity>
                  ))}

              </View>
              <View className="bottom-0 w-full pb-4">
                      <CustomText
                        color="gray_medium"
                        size="extraSmall"
                        numberOfLines={1}
                        boldness="regular"
                      >{`${t("profile.settings.version")} ${
                        packageInfo.version
                      }`}</CustomText>
              </View>
          </ScrollView>

  );
}

export default Settings;

