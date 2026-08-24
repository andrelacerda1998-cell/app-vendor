import { useEffect, useState } from "react";
// import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";
import {useApi} from "@/contexts/ApiContext";
import Axios from "axios";
import {useSession} from "@/contexts/SessionContext";
import NetInfo from '@react-native-community/netinfo';

import {DOMAIN, PROTOCOL} from "@/constants/ApiRoutes";
import { useAppStateStatus } from "@/contexts/AppStateStatusContext";

const useEcho = () => {
    // @ts-ignore
    const [echoInstance, setEchoInstance] = useState<Echo>();
    const {api} = useApi();
    const {session} = useSession();
    const { appStateStatus } = useAppStateStatus();

    useEffect(() => {
        if (!api || !session || appStateStatus !== "active") {
            console.warn("API or session not available, skipping Echo setup.");
            return;
        }

        //  Setup Pusher client
        const PusherClient = new Pusher('ofo5ybpvhjf4i49rj2jm', {
            wsHost: DOMAIN,
            wsPort: 8080,
            forceTLS: false,
            enabledTransports: ["ws","wss",],
            disableStats: true,
            cluster: "mt1",
            auth: {
                headers: {
                    'Authorization': 'Bearer ' + session
                }
            },
            authorizer: (channel, options) => {
                return {
                    authorize: (socketId, callback) => {
                        api.post(PROTOCOL + DOMAIN + "/broadcasting/auth", {
                            socket_id: socketId,
                            channel_name: channel.name
                        })
                            .then(response => {
                                // @ts-ignore
                                return callback(false, response.data);
                            })
                            .catch(error => {
                                console.error('Authorization error:', error);
                                // @ts-ignore
                                return callback(true, error);
                            });
                    }
                };
            },
        });
        PusherClient.connection.bind('state_change', (states: any) => {
        });
        PusherClient.connection.bind('connected', () => {
        });

        PusherClient.connection.bind('disconnected', () => {
        });

        PusherClient.connection.bind('error', (error: any) => {
            console.error('Connection error:', error);
        });

        PusherClient.connection.bind('unavailable', () => {
            console.warn('WebSocket service unavailable.');
        });

        const echo = new Echo({
            broadcaster: "reverb",
            client: PusherClient,
        });

        setEchoInstance(echo);

        NetInfo.addEventListener(state => {
            if (state.isConnected) {
                echo.connect();
            } else {
                echo.disconnect();
            }
        });

        // Cleanup on unmount
        return () => {
            if (echo) {
                echo.disconnect();
            }
        };
    }, [api, session, appStateStatus]);

    return echoInstance;
};

export default useEcho;

