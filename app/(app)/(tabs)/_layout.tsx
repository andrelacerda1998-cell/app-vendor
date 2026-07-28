import { Platform, View, Image } from 'react-native';
import { Redirect, SplashScreen, Tabs } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import TabBar from "@/components/TabBar";
import HomeIcon from "@/assets/icons/home";
import { Ionicons } from "@expo/vector-icons";
import UserAvatarIcon from "@/assets/icons/user-avatar";
import { useTranslation } from 'react-i18next';

export default function AppLayout() {
  const { session, isLoading, signOut, vendorData, vendorStatus } = useSession();
  const { t } = useTranslation();

  // useEffect(() => {
  //   setTimeout(() => {
  //     router.navigate('/(app)/confirm-email');
  //   }, 1000);
  // }, [])

  if (isLoading) {
    return SplashScreen.preventAutoHideAsync();
  }

  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      tabBar={(props: any) => {
        return (
          <TabBar {...props}></TabBar>
        )
      }}
      screenOptions={{
        header: () => null,
        tabBarHideOnKeyboard: Platform.OS === "ios" ? true : false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View className="w-6 h-6 items-center justify-center">
              <HomeIcon color={focused ? Colors.support_primary : Colors.gray_strong} filled={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{
          title: t('tabs.agenda'),
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View className="w-7 h-7 items-center justify-center">
              {focused
                ? <Ionicons name="calendar" size={26} color={Colors.support_primary} />
                : <Ionicons name="calendar-outline" size={26} color={Colors.gray_strong} />
              }
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: t('tabs.earnings'),
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View className="w-7 h-7 items-center justify-center">
              {/* Ganhos: cifrão, como no mockup */}
              <Ionicons
                name={focused ? 'cash' : 'cash-outline'}
                size={26}
                color={focused ? Colors.support_primary : Colors.gray_strong}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View className="relative">
              <View className={`h-7 w-7 rounded-full overflow-hidden ${focused && "border-2 border-support_primary"}`}>
                {vendorData?.user?.avatar?.small ? (
                  <Image
                    src={vendorData?.user?.avatar?.small}
                    source={{ uri: vendorData?.user?.avatar?.small }}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <UserAvatarIcon />
                )}
              </View>
              {/* <View className={`w-[16px] h-[16px] absolute -bottom-1 -left-[5px] border-[3px] border-primary rounded-full ${vendorStatus === 'Online' ? 'bg-[#80FA5B]' : 'bg-[#FA805B]'}`}></View> */}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}