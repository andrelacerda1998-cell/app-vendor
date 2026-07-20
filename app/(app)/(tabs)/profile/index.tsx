import BackHeader from '@/components/app/BackHeader';
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from "@/contexts/DialogContext";
import { useSession } from '@/contexts/SessionContext';
import { router } from 'expo-router';
import React, { useState, Fragment } from 'react';
import { useTranslation } from "react-i18next";
import { View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MenuArrow from "@/assets/icons/arrow-menu";
import GearIcon from "@/assets/icons/gear-icon";
import ProfileIcon from "@/assets/icons/person";
import CreditCardIcon from "@/assets/icons/credit-card";
import LogoutIcon from "@/assets/icons/logout";
import ToolIcon from "@/assets/icons/tool";
import LocationIcon from "@/assets/icons/location";


interface Section {
  [key: string]: any;
}

const Profile = () => {
  const { t } = useTranslation();
  const { signOut, vendorData, setVendorData } = useSession();
  const { api } = useApi();
  const { openDialog } = useDialog();

  const sections: Section[] = [
  {
    label: t('profile.my_profile.labels.my_profile'),
    tab: 'My profile',
    margin: 7,
    icon: (
      <View style={{ marginTop: 2, marginLeft: 1 }}>
        <ProfileIcon size={18} />
      </View>
    ),
  },
  {
    label: t('profile.my_profile.labels.payments'),
    tab: 'Payments',
    margin: 5,
    icon: <CreditCardIcon size={22} color="#FFFFFF" />,
  },
  {
    label: t('profile.my_profile.labels.settings'),
    tab: 'Settings',
    margin: 9,
    icon: (
      <View style={{ marginTop: 2 }}>
        <GearIcon size={20} color="#FFFFFF"/>
      </View>
    ),
  },
    {
    label: t('profile.my_profile.labels.my_services'),
    tab: 'My Services',
    margin: 9,
    icon: (
      <View style={{ marginTop: 2 }}>
        <ToolIcon size={22} color="#FFFFFF"/>
      </View>
    ),
  },
  {
    label: t('profile.my_profile.labels.logout'),
    tab: 'Log out',
    margin: 3,
    icon: (
      <View style={{ marginTop: 2, marginRight: 2 }}>
        <LogoutIcon size={18} color="#FFFFFF"/>
      </View>
    ),
  },
];


  const handleNavigation = (tab: string) => {
      switch (tab) {
        case "My profile":
          router.navigate({
            pathname: "/(app)/(pages)/(userprofile)/userprofile",
          });
          break;

        case "Payments":
          router.navigate({
            pathname: "/(app)/(pages)/(payments)/payments",
          });
          break;

        case "Settings":
          router.navigate({
            pathname: "/(app)/(pages)/(settings)/settings",
          });
          break;

        case "My Services":
          router.navigate({
            pathname: "/(app)/(bottom-sheets)/areas",
          });
          break;

        case "City Survey":
          router.navigate('/(app)/(complete-profile)/CompleteProfile');
          break;

        case "Log out":
          openLogOutDialog();

          break;

        default:
          return;
      }
  };

  const [editData, setEditData] = useState({
    date_birthday: false,
    nif: false,
    phone_number: false,
  });

  const changeEditData = (key: keyof typeof editData) => {
    const newEditData = {
      ...editData,
      [key]: !editData[key],
    };
    setEditData(newEditData);
  }

  const openLogOutDialog = () => {
    openDialog({
      title: t('session.logout.title'),
      subtitle: t('session.logout.subtitle'),
      successButtonText: t('session.logout.confirm'),
      cancelButtonText: t('session.logout.cancel'),
      onSuccess: () => {
        signOut();
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-strongest p-5">
      <BackHeader
            backButtonColor="secondary"
            middleItem={() => (
              <CustomText color="secondary" boldness="bold" numberOfLines={1}>
                {t('profile.my_profile.title')}
              </CustomText>
           )}
          otherClasses="pb-5 mt-5"
      />
      <View className={Platform.OS === 'ios' ? "h-[95%]" : "h-[90%]"}>
        {sections.map((section: Section, i: number) => {
          return (
            <Fragment key={i}>
              <CustomTouchableOpacity
                size="small"
                textSize="small"
                type="transparent"
                textColor={"secondary"}
                onPress={() => {
                  handleNavigation(section.tab);
                }}
                textBoldness={"regular"}
              >
                <View className="flex-1 justify-center items-left">
                  <View className="flex-row">
                    <View className="flex-col items-center w-[10%]">
                      {section.icon}
                    </View>
                    <View className="flex-col">
                      <CustomText
                        color="secondary"
                        size="small"
                        classes=""
                        boldness="regular"
                      >
                        {section?.label}
                      </CustomText>
                    </View>
                  </View>
                </View>

                <View className="flex-2 justify-center items-center">
                  <MenuArrow size={18} color="#FFFFFF" />
                </View>
              </CustomTouchableOpacity>
            </Fragment>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default Profile
