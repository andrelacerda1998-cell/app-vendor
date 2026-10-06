import React from 'react';
// O NativeWind v4 carrega os estilos a partir deste ficheiro; tem de ser
// importado uma vez, na raiz. Sem ele nenhum `className` pinta nada.
import '../global.css';
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
import { Linking, Platform, SafeAreaView, StyleSheet, Text, View, Image, Animated, Easing } from 'react-native';
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
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Colors } from "@/constants/Colors";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {ScheduleProvider} from "@/contexts/ScheduleContext";
import { useAndroidForegroundService } from '@/hooks/useAndroidForegroundService';
import { NotificationObserverHandler } from '@/hooks/useNotification';
import { Dimensions } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Keep the splash screen visible while fonts are loading
SplashScreen.preventAutoHideAsync();

/**
 * O tema tem de envolver TUDO — inclusive o fundo do GestureHandlerRootView e
 * a barra de estado —, por isso o Root é só o provider e o resto do arranque
 * vive no RootLayout.
 */
export default function Root() {
    return (
        <AppThemeProvider>
            <RootLayout />
        </AppThemeProvider>
    );
}

function RootLayout() {
    const { theme, themeKey } = useTheme();
    const isDark = theme === 'dark';
    const navigationTheme = buildNavigationTheme(isDark);

    const translateX = useRef(new Animated.Value(0)).current;
    /**
     * Entrada do bloco do logótipo: aparece e assenta, em vez de estar
     * simplesmente lá.
     *
     * O mapa ao fundo já se move, mas o quadrado âmbar era um carimbo colado
     * por cima — a app parecia congelada no primeiro meio segundo, que é
     * precisamente quando a pessoa está a decidir se ela abriu ou não.
     */
    const entrada = useRef(new Animated.Value(0)).current;

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

    Animated.timing(entrada, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    }).start();

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
                    <View className="w-16 h-16 p-4 rounded-full mb-4" style={{ backgroundColor: Colors.support_primary }}>
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

        
            {/* Véu escuro por cima do mapa.
                O mapa é o cenário, não o assunto: sem isto compete com o
                logótipo pelo contraste, e as ruas que passam por trás do
                quadrado âmbar sujam-lhe as arestas. */}
            <View
                style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                }}
            />

            <Animated.View
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: entrada,
                    transform: [{
                        // Entra ligeiramente maior e assenta. O contrário
                        // (crescer de pequeno) lê-se como um botão a ser
                        // premido, não como uma marca a aparecer.
                        scale: entrada.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.08, 1],
                        }),
                    }],
                }}
            >
                <View
                    style={{
                        position: 'absolute',
                        width: 260,
                        height: 260,
                        backgroundColor: Colors.support_primary,
                        // 28 e não 12: é o raio de um ícone de app, e este
                        // quadrado é exactamente isso -- a marca, não um cartão.
                        borderRadius: 28,
                        // Brilho da própria cor, para pousar sobre o mapa em
                        // vez de parecer colado.
                        shadowColor: Colors.support_primary,
                        shadowOpacity: 0.45,
                        shadowRadius: 40,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 20,
                    }}
                />

                <Image
                    source={require('../assets/images/piquet-animated-logo.gif')}
                    style={{ width: 220, height: 220 }}
                    resizeMode="contain"
                />
            </Animated.View>

            
            <Animated.Text
                style={{
                position: 'absolute',
                bottom: 30,
                color: Colors.brand,
                fontSize: 13,
                fontWeight: '600',
                letterSpacing: 1.5,
                fontFamily: 'Poppins_600SemiBold',
                // Entra com o resto, e mais apagado: é uma assinatura, não um
                // título. A letterspacing maior compensa o tamanho.
                opacity: entrada.interpolate({ inputRange: [0, 1], outputRange: [0, 0.75] }),
                }}
            >
                Made in Portugal
            </Animated.Text>
            </View>
        );
    }






    if (!fontsLoaded) {
        return <View style={{ flex: 1, backgroundColor: '#1B1B1B' }} />;
    }




    // Set up the auth context and render our layout inside of it.
/**
 * Tema de navegação escuro.
 *
 * Sem isto o React Navigation usa o tema CLARO por omissão, cujo fundo é
 * quase branco. Nos ecrãs em que a tab bar é `position: absolute` ela tapava-o,
 * mas nos Ganhos — que a tem em fluxo normal e com cantos arredondados — esse
 * fundo espreitava por baixo e à volta, como um contorno claro.
 */
function buildNavigationTheme(isDark: boolean) {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
        ...base,
        colors: {
            ...base.colors,
            background: Colors.bg,
            card: Colors.bg,
            border: Colors.line,
            text: Colors.secondary,
            primary: Colors.brand,
        },
    };
}

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
            <StatusBar backgroundColor="transparent" style={isDark ? "light" : "dark"} animated/>
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
                                                                 <ThemeProvider value={navigationTheme}>
                                                                     {/* A `key` remonta os ECRÃS para apanharem as
                                                                         cores novas. Fica aqui e não mais acima de
                                                                         propósito: os providers (sessão, serviço em
                                                                         curso, sockets) não podem ser recriados só
                                                                         porque se mudou de tema. */}
                                                                     <View key={themeKey} style={{ flex: 1 }}>
                                                                         <Slot/>
                                                                     </View>
                                                                 </ThemeProvider>
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




// Wrapper to call the hook from inside the ServiceProvider
function ForegroundWrapper({ children }: { children: React.ReactNode }) {

 // Hook to keep Foreground Service active
  useAndroidForegroundService();
  return <>{children}</>;
}
