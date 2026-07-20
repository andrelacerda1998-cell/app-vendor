import {ApiProvider} from '@/contexts/ApiContext';
import {SessionProvider} from '@/contexts/SessionContext';
import {Slot} from 'expo-router';
import {useFonts} from 'expo-font';
import {
    Poppins_100Thin,
    Poppins_100Thin_Italic,
    Poppins_200ExtraLight,
    Poppins_200ExtraLight_Italic,
    Poppins_300Light,
    Poppins_300Light_Italic,
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_500Medium_Italic,
    Poppins_600SemiBold,
    Poppins_600SemiBold_Italic,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
    Poppins_800ExtraBold_Italic,
    Poppins_900Black,
    Poppins_900Black_Italic,
} from '@expo-google-fonts/poppins';
import {useCallback, useEffect, useState, useRef} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import {Linking, Platform, SafeAreaView, Text, TouchableOpacity, View, Image, ImageBackground, Animated } from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {ClickOutsideProvider} from 'react-native-click-outside';
import {StatusBar} from 'expo-status-bar';
import {DialogProvider} from "@/contexts/DialogContext";
import Dialog from "@/components/Dialog";
import {ServiceProvider} from "@/contexts/ServiceContext";
import {NotificationsProvider} from "@/contexts/NotificationsContext";
import {CampaignProvider} from "@/contexts/CampaignContext";
import {ActionSheetProvider} from "@expo/react-native-action-sheet";
import {LocationProvider} from "@/contexts/LocationContext";
import '@/translation';
import AppStateStatusProvider from "@/contexts/AppStateStatusContext";
import { useTranslation } from "react-i18next";
import { API_ROUTES } from "@/constants/ApiRoutes";
import axios from "axios";
import packageInfo from '@/package.json';
import XIcon from "@/assets/icons/x";
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { PACKAGE_NAME, APP_STORE_URL } from "@/app.config";
import { isVersionOutdated } from "@/utils";
import { Colors } from "@/constants/Colors";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {ScheduleProvider} from "@/contexts/ScheduleContext";
// import FloatingView from '@/components/floating-view/FloatingView';
import { useAndroidForegroundService } from '@/hooks/useAndroidForegroundService';
import { NotificationObserverHandler } from '@/hooks/useNotification';
import { Dimensions } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Keep the splash screen visible while fonts are loading
SplashScreen.preventAutoHideAsync();

export default function Root() {

    const translateX = useRef(new Animated.Value(0)).current;

    const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
    const splashHidden = useRef(false);
    const { t } = useTranslation();
    const [needsUpdate, setNeedsUpdate] = useState(false);

    const [fontsLoaded] = useFonts({
        Poppins_100Thin,
        Poppins_100Thin_Italic,
        Poppins_200ExtraLight,
        Poppins_200ExtraLight_Italic,
        Poppins_300Light,
        Poppins_300Light_Italic,
        Poppins_400Regular,
        Poppins_400Regular_Italic,
        Poppins_500Medium,
        Poppins_500Medium_Italic,
        Poppins_600SemiBold,
        Poppins_600SemiBold_Italic,
        Poppins_700Bold,
        Poppins_700Bold_Italic,
        Poppins_800ExtraBold,
        Poppins_800ExtraBold_Italic,
        Poppins_900Black,
        Poppins_900Black_Italic,
    });

    const onLayoutAnimatedSplash = useCallback(async () => {
        if (fontsLoaded && !splashHidden.current) {
            splashHidden.current = true;   

            await SplashScreen.hideAsync();

            setTimeout(() => {
            setShowAnimatedSplash(false);
            }, 1500);
        }
    }, [fontsLoaded]);


    useEffect(() => {
    if (fontsLoaded && showAnimatedSplash) {
        // Hides expo splash
        SplashScreen.hideAsync().finally(() => {
        // Keeps gif visible
        setTimeout(() => {
            setShowAnimatedSplash(false); 
        }, 3650); //<--- increments the splash duration from prev 1500 to 3650
        });
    }
    }, [fontsLoaded, showAnimatedSplash]);


    useEffect(() => {
    if (!showAnimatedSplash) return;

    const animation = Animated.loop(
        Animated.sequence([
        Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH, 
            duration: 15000,
            useNativeDriver: true,
        }),
        Animated.timing(translateX, {
            toValue: 0, // reset
            duration: 0,
            useNativeDriver: true,
        }),
        ])
    );

    animation.start();

    return () => animation.stop();
    }, [showAnimatedSplash]);


    // const onLayoutRootView = useCallback(async () => {
    //     if (fontsLoaded) {
    //         await SplashScreen.hideAsync();
    //     }
    // }, [fontsLoaded]);

    useEffect(() => {
         getUpdate();
    }, []);

    useEffect(() => {
        SystemUI.setBackgroundColorAsync(Colors.primary);
    }, []);

    // useEffect(() => {
    //     onLayoutRootView();
    // }, [fontsLoaded]);

    const getUpdate = async () => {
        try {
            const res = await axios.get(API_ROUTES.COMMON_APP_VERSION);
            // @ts-ignore
            const min = res?.data?.data?.['vendor']?.[Platform.OS];
            setNeedsUpdate(!!min && isVersionOutdated(packageInfo.version, min));
        } catch (error) {
            // fail-open: não conseguir verificar a versão não bloqueia o utilizador
            setNeedsUpdate(false);
        }
    };

    // if (!fontsLoaded) {
    //     return <View style={{flex: 1, backgroundColor: Colors.primary}}></View>;
    // }






    if (needsUpdate) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent:'center', alignItems: 'center', backgroundColor: Colors.primary, padding: 20 }}>
                <StatusBar backgroundColor="transparent" animated />
                <View className="flex-1 items-center justify-center">
                    <View className="w-16 h-16 p-4 rounded-full bg-support_primary mb-4">
                        <XIcon color={Colors.primary} />
                    </View>
                    <CustomText
                        color="support_primary"
                        size="large"
                        boldness="semiBold"
                        className="text-center"
                    >
                        {t('errors.need_update.title')}
                    </CustomText>
                    <CustomText
                        color="support_primary"
                        size="medium"
                        className="text-center"
                    >
                        {t('errors.need_update.subtitle')}
                    </CustomText>
                </View>
                <View className="w-full">
                    <CustomTouchableOpacity
                        size="large"
                        type="support_primary"
                        textColor="primary"
                        textBoldness="semiBold"
                        text={t('errors.need_update.button')}
                        onPress={() => {
                            const storeUrl =
                                Platform.OS === 'ios'
                                    ? APP_STORE_URL
                                    : `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;
                            Linking.openURL(storeUrl);
                        }}
                    />
                </View>
            </SafeAreaView>
        );
    }


 
   
    if (showAnimatedSplash) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'black',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                }}
            >
            
            <Animated.Image
                source={require('../assets/images/vector.png')}
                style={{
                position: 'absolute',
                width: SCREEN_WIDTH * 2,  
                height: '100%',
                transform: [{ translateX }],
                }}
                resizeMode="stretch"  
            />

        
            <View
                style={{
                position: 'absolute',
                width: 260,
                height: 260,
                backgroundColor: '#FABB5B',
                borderRadius: 12,
                }}
            />

        
            <Image
                source={require('../assets/images/piquet-animated-logo.gif')}
                style={{ width: 220, height: 220 }}
                resizeMode="contain"
            />

            
            <Text
                style={{
                position: 'absolute',
                bottom: 30,
                color: '#FABB5B',
                fontSize: 14,
                fontWeight: '600',
                letterSpacing: 1,
                fontFamily: 'Poppins_600SemiBold',
                }}
            >
                Made in Portugal
            </Text>
            </View>
        );
    }






    if (!fontsLoaded) {
        return <View style={{ flex: 1, backgroundColor: '#1B1B1B' }} />;
    }




    // Set up the auth context and render our layout inside of it.
    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.primary }}>
            <StatusBar backgroundColor="transparent" style="light" animated/>
            <KeyboardProvider>
                <AppStateStatusProvider>
                    <ActionSheetProvider>
                        <ClickOutsideProvider>
                            <DialogProvider>
                                <SessionProvider>
                                    <ApiProvider>
                                        <ServiceProvider>
                                             <ScheduleProvider>
                                                 <NotificationsProvider>
                                                     <CampaignProvider>
                                                         <NotificationObserverHandler />
                                                         <LocationProvider>
                                                             <ForegroundWrapper>
                                                                 <Slot/>
                                                                 <Dialog/>
                                                             </ForegroundWrapper>
                                                         </LocationProvider>
                                                     </CampaignProvider>
                                                 </NotificationsProvider>
                                             </ScheduleProvider>
                                        </ServiceProvider>
                                    </ApiProvider>
                                </SessionProvider>
                            </DialogProvider>
                        </ClickOutsideProvider>
                    </ActionSheetProvider>
                </AppStateStatusProvider>
            </KeyboardProvider>
        </GestureHandlerRootView>
    );
}




// function FloatingViewWrapper() {
//   return <FloatingView />
// }

// Wrapper to call the hook from inside the ServiceProvider
function ForegroundWrapper({ children }: { children: React.ReactNode }) {

 // Hook to keep Foreground Service active
  useAndroidForegroundService();
  return <>{children}</>;
}
