import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useStorageState } from '@/hooks/useStorageState';
import { useApi } from './ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import axios from 'axios';
import {useAsyncStorage} from "@/hooks/useAsyncStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VendorDataInterface, WalletInterface } from "@/types/session";
import i18n from "@/translation";
import { NativeModules, Platform } from "react-native";
import XIcon from "@/assets/icons/x";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";
import { useDialog } from "./DialogContext";

interface SessionContextType {
    // isAuthenticated: boolean;
    // sessionToken: string | null;
    // login: () => void;
    // logout: () => void;
    signOut: () => void;
    // setSessionToken: (token: string | null) => void;
    isLoading: boolean;
    session: string | null;
    setSession: (token: string | null) => void;
    isLoadingUserData: boolean;
    vendorData: VendorDataInterface | null;
    setVendorData: (data: any) => void;
    fetchAndSaveUserData: () => void;
    wallet: WalletInterface | null;
    setWallet: (wallet: WalletInterface | null) => void;
    vendorStatus: 'Online' | 'Offline' | undefined;
    setVendorStatus: (status: 'Online' | 'Offline') => void;
    getWalletInfo: () => Promise<void>;
    changeUserLanguage: () => void;
    getAvailableGenders: () => void;
    availableGenders: { id: number; name: string; }[];
}

const SessionContext = createContext<SessionContextType>({
    // isAuthenticated: false,
    // sessionToken: null,
    // login: () => {},
    // logout: () => {},
    signOut: () => {},
    // setSessionToken: () => {},
    isLoading: true,
    session: null,
    setSession: () => {},
    isLoadingUserData: true,
    vendorData: null,
    setVendorData: () => {},
    fetchAndSaveUserData: () => {},
    wallet: null,
    setWallet: () => {},
    vendorStatus: 'Offline',
    setVendorStatus: () => {},
    getWalletInfo: async () => {},
    changeUserLanguage: () => {},
    getAvailableGenders: () => {},
    availableGenders: [],
});

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { openDialog } = useDialog();
    const { t } = useTranslation();
    const [[isLoading, session], setSession] = useStorageState('session');
    const [[isLoadingUserData, vendorData], setVendorData] = useAsyncStorage('vendor-data');
    const [vendorStatus, setVendorStatus] = useState<'Online' | 'Offline'>();
    const [wallet, setWallet] = useState<WalletInterface | null>(null);
    const [availableGenders, setAvailableGenders] = useState<{ id:number; name:string; }[]>([]);

    const getAvailableGenders = () => {
        axios.get(API_ROUTES.COMMON_GET_GENDERS, {
            headers: {
                'Accept-Language': i18n.language === 'pt_PT' ? 'pt-pt' : 'en',
            }
        })
            .then(response => {
                setAvailableGenders(response.data.data.genders);
            })
            .catch(error => {
                openDialog({
                    icon: <XIcon color={Colors.primary} />,
                    title: t('errors.title'),
                    subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.occurred_an_error'),
                    closeAfterMSeconds: 2000,
                    closeOnClickOutside: true,
                })
            });
	}

    const changeUserLanguage = async () => {
        const locale = getDeviceLocale();
        if (locale) {
            const lang = locale.split('_')[0];
            axios.post(API_ROUTES.AUTH_LOCALE, {
                language: lang === 'pt' ? 'pt-pt' : 'en'
            }, {
                headers: {
                    Authorization: `Bearer ${session}`
                }
            })
                .then(() => {
                    if (lang === 'pt') {
                        i18n.changeLanguage('pt_PT');
                    } else {
                        i18n.changeLanguage('en_US');
                    }
                })
        }
    }

    const getDeviceLocale = () => {
        if (Platform.OS === 'ios') {
          return NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0];
        } else if (Platform.OS === 'android') {
          return NativeModules.I18nManager.localeIdentifier;
        }
    }

    const signOut = () => {
        if (session) {
            axios.delete(API_ROUTES.AUTH_LOGOUT, {
                headers: {
                    Authorization: `Bearer ${session}`
                }
            }).then(() => {
                setSession(null);
                setVendorData(null);
                AsyncStorage.removeItem('citySurveyDone');
            }).catch((error) => {
                if (error?.response?.status === 401) {
                    setSession(null);
                    setVendorData(null);
                    AsyncStorage.removeItem('citySurveyDone');
                }
            });
        } else {
            setSession(null);
            setVendorData(null);
            AsyncStorage.removeItem('citySurveyDone');
        }
    }


    const fetchAndSaveUserData = () => {
        axios.get(API_ROUTES.AUTH_ME, {
            headers: {
                Authorization: `Bearer ${session}`
            }
        }).then((response) => {
            // console.log(response.data.data, 'auth me response')

            setVendorData(response.data.data);
            // const language = response.data.data.language || response.data.data.user.language;
            // if (language === 'pt-pt') {
            //     i18n.changeLanguage('pt_PT');
            // } else {
            //     i18n.changeLanguage('en_US');
            // }
        }).catch((error) => {
            // Log sanitizado: só status + mensagem, sem despejar o corpo da resposta.
            console.error('fetchAndSaveUserData failed', error?.response?.status, error?.response?.data?.message ?? error?.message);
            signOut();
        })
    }

    const getWalletInfo = async () => {
        try {
            const response = await axios.get(API_ROUTES.VENDOR_GET_WALLET, {
                headers: {
                    Authorization: `Bearer ${session}`
                }
            })
            setWallet(response.data.data);
        } catch (error: any) {
            console.error('getWalletInfo failed', error?.response?.status, error?.response?.data?.message ?? error?.message);
        }
    };

    useEffect(() => {
      if (session) {
        changeUserLanguage();
        fetchAndSaveUserData();
      }
    }, [session])

    if (typeof vendorData === 'string') {
        return null;
    }

    return (
        <SessionContext.Provider
            value={{
                // isAuthenticated,
                // sessionToken,
                // setSessionToken,
                signOut,
                isLoading,
                session,
                setSession,
                isLoadingUserData,
                vendorData,
                setVendorData,
                fetchAndSaveUserData,
                wallet,
                setWallet,
                vendorStatus,
                setVendorStatus,
                getWalletInfo,
                changeUserLanguage,
                getAvailableGenders,
                availableGenders,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export function useSession() {
    const value = useContext(SessionContext);
    if (!value) {
        throw new Error('useSession must be wrapped in a <SessionProvider />');
    }

    return value;
}
