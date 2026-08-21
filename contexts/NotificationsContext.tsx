import React, {PropsWithChildren, useEffect, useRef, useState} from "react";
import { track, AnalyticsEvent } from '@/utils/analytics';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from "react-native";
import {useApi} from "@/contexts/ApiContext";
import {useSession} from "@/contexts/SessionContext";
import { Colors } from "@/constants/Colors";

/**
 * Canal Android dedicado aos PEDIDOS de serviço.
 *
 * Um pedido tem janela curta: se o técnico não o ouvir, perde-o. Por isso vive
 * num canal próprio, com importância MAX, vibração e som — separado do canal
 * `default`, que continua a servir tudo o resto (campanhas, avisos, etc.) sem
 * alterações de comportamento.
 *
 * O backend tem de mandar `channelId: 'requests'` no push (Expo → FCM) para o
 * pedido cair neste canal; sem isso o Android usa o `default`.
 */
export const REQUESTS_CHANNEL_ID = 'requests';

/**
 * Canal do serviço a decorrer — a notificação fixa com o cliente, o serviço e
 * a hora de fim.
 *
 * Importância LOW de propósito: é informação de consulta, não um alerta. Com
 * importância alta faria som e vibração de cada vez que fosse atualizada, o
 * que num serviço de 45 minutos seria insuportável.
 */
export const ONGOING_CHANNEL_ID = 'ongoing_service';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        // Som ligado: um pedido silencioso é um pedido perdido.
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const NotificationsContext = React.createContext<{
    /** Verdadeiro quando o técnico recusou as notificações do sistema. */
    permissionDenied: boolean;
}>({
    permissionDenied: false,
});

export function NotificationsProvider({ children }: PropsWithChildren){
    const [expoPushToken, setExpoPushToken] = useState('');
    // Sem notificações o técnico deixa de saber que há pedidos. Antes esta recusa
    // era engolida em silêncio; agora fica registada para a Home poder avisar.
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [channels, setChannels] = useState<Notifications.NotificationChannel[]>([]);
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(
        undefined
    );
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();
    const { api } = useApi();
    const {session } = useSession();


    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            token && setExpoPushToken(token)
        });

        if (Platform.OS === 'android') {
            Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
        }
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        });

        return () => {
            notificationListener.current &&
            Notifications.removeNotificationSubscription(notificationListener.current);
            responseListener.current &&
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    useEffect(() => {
        if (session && api && expoPushToken) {
            api.post('/auth/device', {
                expoPushToken,
                deviceName: Device.modelName
            })
        }
    }, [expoPushToken, session]);

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            })
            .then(() => {
            })
            .catch((error) => {
            });

            // Canal só para pedidos: MAX + som + vibração insistente, para o
            // técnico ouvir mesmo com o telemóvel no bolso.
            await Notifications.setNotificationChannelAsync(REQUESTS_CHANNEL_ID, {
                name: 'Pedidos de serviço',
                description: 'Novos pedidos à espera de resposta.',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 400, 200, 400, 200, 400],
                enableVibrate: true,
                sound: 'default',
                lightColor: Colors.brand,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: false,
            })
            .catch(() => {
                // Canal já existente ou API indisponível: o `default` cobre o caso.
            });

            // Serviço a decorrer: silencioso e sem vibração — ver ONGOING_CHANNEL_ID.
            await Notifications.setNotificationChannelAsync(ONGOING_CHANNEL_ID, {
                name: 'Serviço a decorrer',
                description: 'Mostra o serviço em curso enquanto trabalhas.',
                importance: Notifications.AndroidImportance.LOW,
                enableVibrate: false,
                sound: null,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            })
            .catch(() => {});
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                setPermissionDenied(true);
                track(AnalyticsEvent.NOTIFICATIONS_DENIED);
                return;
            }
            setPermissionDenied(false);
            track(AnalyticsEvent.NOTIFICATIONS_GRANTED);

            try {
                const projectId =
                    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                if (!projectId) {
                    throw new Error('Project ID not found');
                }
                token = (
                    await Notifications.getExpoPushTokenAsync({
                        projectId,
                    })
                ).data;
            } catch (e) {
                console.error(e);
                // Não usar a string de erro como token: deixá-lo undefined para que a guarda
                // `token && setExpoPushToken(token)` bloqueie o POST /auth/device com lixo.
            }
        } else {
        }


        return token;
    }

    return <NotificationsContext.Provider value={{ permissionDenied }}>{children}</NotificationsContext.Provider>;
}

export const useNotificationPermission = () => React.useContext(NotificationsContext);
