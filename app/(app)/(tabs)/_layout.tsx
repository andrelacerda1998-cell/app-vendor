import { KeyboardAvoidingView, Platform, Text, View, Modal, Image } from 'react-native';
import { Redirect, router, SplashScreen, Stack, Tabs, useNavigation } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import TabBar from "@/components/TabBar";
import HomeIcon from "@/assets/icons/home";
import WalletIcon from "@/assets/icons/wallet";
import CalendarIcon from "@/assets/icons/calendar";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import UserAvatarIcon from "@/assets/icons/user-avatar";

export default function AppLayout() {
  const { session, isLoading, signOut, vendorData, vendorStatus } = useSession();

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
          title: "Home",
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
          title: "Wallet",
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View className="w-7 h-7 items-center justify-center">
              {focused
                ? <Ionicons name="wallet" size={28} color={Colors.support_primary} />
                : <Ionicons name="wallet-outline" size={28} color={Colors.gray_strong} />
              }
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: "History",
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View className="w-7 h-7 items-center justify-center">
              {focused
                ? <AntDesign name="clockcircle" size={24} color={Colors.support_primary} />
                : <AntDesign name="clockcircleo" size={24} color={Colors.gray_strong} />
              }
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
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