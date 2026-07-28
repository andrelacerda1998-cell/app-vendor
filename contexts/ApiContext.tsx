import React, {type PropsWithChildren, useContext, useEffect, useRef, useState} from "react";
import axios, {AxiosInstance} from "axios";
import {Alert} from "react-native";
import * as Clipboard from "expo-clipboard";
import {jwtDecode} from "jwt-decode";
import {API_BASE_URL} from "@/constants/ApiRoutes";
import {useSession} from "@/contexts/SessionContext";
import "core-js/stable/atob";
import { useDialog } from "./DialogContext";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/Colors";
import XIcon from "@/assets/icons/x";
import { initAnalytics } from "@/utils/analytics";

const ApiContext = React.createContext<{
    api: AxiosInstance;
}>({
    api: axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
    }),
});

export function ApiProvider({ children }: PropsWithChildren) {
    const { signOut, session, setSession } = useSession();
    const { openDialog } = useDialog();
    const { t } = useTranslation();
    const [api] = useState<AxiosInstance>(axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
    }));
    // Single-flight: partilha uma única promise de refresh em curso. Sem isto, dois pedidos a
    // expirar ao mesmo tempo chamam refresh em paralelo; o 1º faz blacklist do token e o 2º falha
    // com o token já invalidado → signOut indevido.
    const refreshPromiseRef = useRef<Promise<string | undefined> | null>(null);
    useEffect(() => {
        const instance = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
        });

        instance.interceptors.request.use(async (config) => {
            let token = session;

            if (token) {
                try {
                    const date = jwtDecode(token)['exp'];
                    const now = Math.floor(Date.now() / 1000);

                    if (date && date < now) {
                        token = await refreshToken();
                        if (!token) {
                            // O refresh falhou — refreshToken() já tratou o signOut/diálogo.
                            // Não enviar "Bearer undefined": abortar o pedido de forma limpa.
                            return Promise.reject(new axios.Cancel('token refresh failed'));
                        }
                    }
                } catch (e) {
                    console.error("Failed to decode token:", e);
                    signOut();
                    openDialog({
                        icon: <XIcon color={Colors.primary} />,
                        title: t('session.logout.success.title'),
                        subtitle: t('session.logout.success.subtitle_error'),
                        closeAfterMSeconds: 3000,
                        closeOnClickOutside: true,
                    });
                    return config;
                }

                config.headers.Authorization = "Bearer " + token;
            }
            return config;
        });

        instance.interceptors.response.use(
            async (response) => {
                return response
            },
            async (error) => {
                return handleError(error, instance);
            }
        );

        Object.assign(api, instance);

        // Analytics passa a usar esta instância (com token e refresh já tratados).
        initAnalytics(api);
    }, [session]);

    async function refreshToken() {
        if (!session) {
            return;
        }
        // Reutiliza o refresh já em curso (single-flight) em vez de disparar um novo.
        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }
        refreshPromiseRef.current = (async () => {
            try {
                const response = await axios.post(API_BASE_URL+"/auth/refresh", [], {
                    headers: {
                        Authorization: "bearer " + session,
                    },
                });
                const { access_token } = response?.data.data;

                if (access_token) {
                    setSession(access_token);
                    return access_token;
                }
                return undefined;
            } catch (error) {
                console.error("Failed to refresh token:", error);
                signOut();
                openDialog({
                    icon: <XIcon color={Colors.primary} />,
                    title: t('session.logout.success.title'),
                    subtitle: t('session.logout.success.subtitle_timeout'),
                    closeAfterMSeconds: 3000,
                    closeOnClickOutside: true,
                });
                return undefined;
            } finally {
                refreshPromiseRef.current = null;
            }
        })();
        return refreshPromiseRef.current;
    }


    const handleError = async (error: any, apiInstance: AxiosInstance) => {
        const originalRequest = error.config;

        // Check if the session is still valid
        if (!session) {
            return Promise.reject(error);
        }

        // Perante um 401, tentar renovar o token UMA vez e repetir o pedido.
        // O guard `_retry` garante uma única repetição (sem ciclo infinito).
        if (error?.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const access_token = await refreshToken();

            if (access_token) {
                originalRequest.headers.Authorization = "Bearer " + access_token;
                return apiInstance(originalRequest);
            }

            // O refresh falhou — refreshToken() já fez signOut + diálogo.
            return Promise.reject(error);
        }

        return Promise.reject(error);
    };


    return <ApiContext.Provider value={{ api }}>{children}</ApiContext.Provider>;
}

export function useApi() {
    return useContext(ApiContext);
}
