import {ConfigContext, ExpoConfig} from "@expo/config";
import packageInfo from "./package.json";

const APP_NAME = "Piquet Vendor";
const BUNDLE_IDENTIFIER = "com.piquetapp.vendor";
export const PACKAGE_NAME = "com.piquetapp.vendor";
export const APP_STORE_URL = "https://apps.apple.com/us/app/piquet-profissional/id6745837081";
const ICON = "./assets/images/icon.png";
const SCHEME = "piquet.vendor"
const VERSION = packageInfo.version;

export default ({config}: ConfigContext):ExpoConfig => {
    const environment = (process.env.APP_ENV ?? "development") as "development" | "preview" | "staging" | "production";
    const {name, packageName, ICON, bundleIdentifier, apiEndpoint, apiProtocol, version, scheme} = getDynamicAppConfig(environment);
    const updateChannel = environment === "production" ? "production"
        : environment === "staging" ? "staging"
        : environment === "preview" ? "preview"
        : "development";

    //@ts-ignore
    return {
        ...config,
        name: name,
        slug: "piquet-vendor",
        version: version,
        orientation: "portrait",
        icon: ICON,
        scheme: scheme,
        owner: "piquet",
        userInterfaceStyle: "automatic",
        jsEngine: "hermes",
        runtimeVersion: version,
        updates: {
            url: "https://u.expo.dev/20ae14b2-f775-4cab-b460-3fe740ae20bc",
            enabled: environment !== "development",
            checkAutomatically: "ON_LOAD",
            fallbackToCacheTimeout: 0,
            // `channel` não está no tipo ExpoConfig.updates mas o EAS lê-o do
            // manifesto; o spread evita o excess-property check sem mudar o output.
            ...({ channel: updateChannel } as Record<string, unknown>),
        },
        ios: {
            appleTeamId: "Z7V222283F",
            appStoreUrl:"https://apps.apple.com/us/app/piquet-profissional/id6745837081",
            supportsTablet: false,
            bundleIdentifier: bundleIdentifier,
            config: {
                usesNonExemptEncryption: false,
                googleMapsApiKey: process.env.GOOGLE_API_KEY,
            },
            // splash: {
            //     image: "./assets/images/splash.png",
            //     resizeMode: "cover",
            //     backgroundColor: "#1B1B1B"
            // },
            infoPlist: {
                UIBackgroundModes: ["location", "fetch"],
                CFBundleAllowMixedLocalizations: true,
                CFBundleLocalizations: ["pt", "en"],
                NSCameraUsageDescription: "A câmara é utilizada para fotografar documentos e fotos de perfil necessários para o registo e verificação da sua conta como prestador de serviços.",
                NSPhotoLibraryUsageDescription: "O acesso à galeria de fotos é necessário para selecionar imagens de documentos e fotos de perfil para o registo e verificação da sua conta como prestador de serviços.",
                NSMicrophoneUsageDescription: "O microfone é utilizado durante gravações de vídeo feitas pela câmara da aplicação.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "A localização em segundo plano é necessária para que a aplicação identifique prestadores de serviços próximos e envie pedidos de serviço em tempo real.",
                NSLocationAlwaysUsageDescription: "A localização em segundo plano é necessária para que a aplicação identifique prestadores de serviços próximos e envie pedidos de serviço em tempo real.",
                NSLocationWhenInUseUsageDescription: "A sua localização é utilizada para encontrar prestadores de serviços próximos e calcular rotas até ao cliente.",
            }
        },
        android: {
            softwareKeyboardLayoutMode: "pan",
            package: packageName,
            versionCode:25,
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#1B1B1B"
            },
            // splash: {
            //     image: "./assets/images/icon.png",
            //     resizeMode: "contain",
            //     backgroundColor: "#FABB5B",
            // },
            config: {
                googleMaps:{
                    apiKey: process.env.GOOGLE_API_KEY
                }
            },
            permissions: [
                "ACCESS_FINE_LOCATION",
                "ACCESS_COARSE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
            ],
            googleServicesFile: "./keys/google-services.json",
        },
        locales: {
            en: "./assets/locales/en.json",
            pt: "./assets/locales/pt.json"
        },
        plugins: [
            "./plugins/withXcode26BuildFixes",
            "expo-updates",
            "expo-localization",
            "expo-router",
            "expo-font",
            "expo-document-picker",
            "expo-secure-store",
            "expo-notifications",
            [
                "expo-splash-screen", {
                    "splashScreenDelay": 0,
                    "resizeMode": "contain",
                    "backgroundColor": "#1B1B1B",
                    // "image": "./assets/images/splash-icon.png",
                    "image": "./assets/images/vector.png"
                }
            ],
            "expo-secure-store",
            [
                "expo-location",{
                "isAndroidBackgroundLocationEnabled": true,
                "isAndroidForegroundServiceEnabled": true
            }
            ],
            "react-native-map-link"
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            API_URL: apiEndpoint,
            API_PROTOCOL: apiProtocol,
            eas: {
                "projectId": "20ae14b2-f775-4cab-b460-3fe740ae20bc"
            }
        },
    }
}

const getDynamicAppConfig = (environment: "development" | "preview" | "staging" | "production") => {
    if (environment === "production") {
        return {
            name: APP_NAME,
            bundleIdentifier: BUNDLE_IDENTIFIER,
            packageName: PACKAGE_NAME,
            ICON: ICON,
            scheme: SCHEME,
            version: VERSION,
            apiEndpoint: "app.piquetapp.com",
            apiProtocol: "https://",

        }
    }
    if (environment === "staging") {
        return {
            name: APP_NAME,
            bundleIdentifier: BUNDLE_IDENTIFIER+".staging",
            packageName: PACKAGE_NAME+".staging",
            ICON: ICON,
            scheme: SCHEME,
            version: VERSION,
            apiEndpoint: "piquet-stg.rwinteractive.net",
            apiProtocol: "https://",

        }
    }

    if (environment === "preview"){
        return {
            name: APP_NAME+" Preview",
            bundleIdentifier: BUNDLE_IDENTIFIER+".preview",
            packageName: PACKAGE_NAME+".preview",
            ICON: ICON,
            scheme: SCHEME,
            version: VERSION,
            apiEndpoint: "piquet.rwinteractive.net",
            apiProtocol: "https://",
        }
    }


    return {
        name: APP_NAME+" Development",
        bundleIdentifier: BUNDLE_IDENTIFIER+".development",
        packageName: PACKAGE_NAME+".development",
        ICON: ICON,
        scheme: SCHEME,
        version: VERSION,
        apiEndpoint: process.env.EXPO_PUBLIC_DEV_API_DOMAIN,
        apiProtocol: process.env.EXPO_PUBLIC_DEV_API_PROTOCOL,
    }
}
