import React, {PropsWithChildren, useEffect, useRef, useState} from "react";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from "react-native";
import {useApi} from "@/contexts/ApiContext";
import {useSession} from "@/contexts/SessionContext";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

const NotificationsContext = React.createContext<{

}>({

});

export function NotificationsProvider({ children }: PropsWithChildren){
    const [expoPushToken, setExpoPushToken] = useState('');
    const [channels, setChannels] = useState<Notifications.NotificationChannel[]>([]);
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(
        undefined
    );
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();
    const { api } = useApi();
    const {session } = useSession();

    // console.log("Notifications provider")

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            token && setExpoPushToken(token)
        });

        if (Platform.OS === 'android') {
            Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
        }
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // console.log("notification", notification)
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            // console.log({response});
        });

        return () => {
            notificationListener.current &&
            Notifications.removeNotificationSubscription(notificationListener.current);
            responseListener.current &&
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    useEffect(() => {
        // console.log({expoPushToken})
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
                // console.log("Notification channel created");
            })
            .catch((error) => {
                // console.log("Error creating notification channel: ", error);
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                //alert('Failed to get push token for push notification!');
                return;
            }

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
                // console.log(token);
            } catch (e) {
                console.error(e);
                // Não usar a string de erro como token: deixá-lo undefined para que a guarda
                // `token && setExpoPushToken(token)` bloqueie o POST /auth/device com lixo.
            }
        } else {
            // console.log("Notifications, disabled")
        }


        return token;
    }

    return <NotificationsContext.Provider value={{expoPushToken}}>{children}</NotificationsContext.Provider>;
}
