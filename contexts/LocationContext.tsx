import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {API_ROUTES} from '@/constants/ApiRoutes';
import axios, { AxiosError } from 'axios';
import * as SecureStore from "expo-secure-store";
import {useApi} from "@/contexts/ApiContext";
import { useDialog } from "./DialogContext";
import XIcon from "@/assets/icons/x";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";
import { AppState, Linking, Platform } from "react-native";
import {getDeviceId} from "@/utils";
import { useSession } from "./SessionContext";

const LOCATION_TASK_NAME = 'background-location-task';

type StartTrackingResult = { ok: boolean; reason?: 'permission' | 'tracking' };

interface LocationContextType {
    locationPermission: {
        foreground: boolean,
        background: boolean,
    },
    permissionsChecked: boolean,
    isTracking: boolean,
    lastLocation: Location.LocationObject | null,
    requestPermissions: () => Promise<boolean>,
    startTracking: () => Promise<StartTrackingResult>,
    stopTracking: () => Promise<boolean>,
    getCurrentLocation: () => Promise<Location.LocationObject | null>,
}

if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({data, error}) => {
        if (error) {
            console.error(error);
            return;
        }
        if (data) {
            const { locations } = data;
            if (Array.isArray(locations) && locations.length > 0) {
                try {
                    const token = await SecureStore.getItemAsync('session');
                    if (!token) {
                        return;
                    }
                    const headers = token ? {Authorization: `Bearer ${token}`} : {};

                    await axios.put(API_ROUTES.VENDOR_UPDATE_LOCATION, {
                        latitude: locations[0].coords.latitude,
                        longitude: locations[0].coords.longitude,
                        device_id: await getDeviceId()

                    }, {
                        headers
                    });

                } catch (err) {
                    const error = err as AxiosError;
                    console.error('error sending location:', error.response?.status, error.response?.data || error.message);
                }
            }
        }
    });
}

TaskManager.getRegisteredTasksAsync().then(result => {});

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [locationPermission, setLocationPermission] = useState({
        foreground: false,
        background: false,
    });
    const [permissionsChecked, setPermissionsChecked] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);
    const {api} = useApi();
    const { openDialog } = useDialog();
    const { t } = useTranslation();
    const { session } = useSession();

    const refreshPermissions = async () => {
        const [foreground, background] = await Promise.all([
            Location.getForegroundPermissionsAsync(),
            Location.getBackgroundPermissionsAsync(),
        ]);

        const nextPermissions = {
            foreground: foreground.status === 'granted',
            background: Platform.OS === 'ios'
                ? foreground.status === 'granted'
                : background.status === 'granted',
        };

        setLocationPermission(nextPermissions);

        return nextPermissions;
    };

    useEffect(() => {
        if (!session) {
            stopTracking();
        }
    }, [session]);

    useEffect(() => {
        const checkInitialState = async () => {
            try {
                const [permissions, tasks] = await Promise.all([
                    refreshPermissions(),
                    TaskManager.getRegisteredTasksAsync(),
                ]);

                setIsTracking(tasks.some(task => task.taskName === LOCATION_TASK_NAME));

                if (!permissions.background && tasks.some(task => task.taskName === LOCATION_TASK_NAME)) {
                    setIsTracking(false);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setPermissionsChecked(true);
            }
        };

        checkInitialState();
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextState) => {
            if (nextState !== 'active') {
                return;
            }

            try {
                await refreshPermissions();
            } catch (error) {
                console.error(error);
            }
        });

        return () => subscription.remove();
    }, []);

    const requestPermissions = async (): Promise<boolean> => {
        try {
            let foregroundStatus: Location.PermissionStatus | null = null;
            let backgroundStatus: Location.PermissionStatus | null = null;

            if (Platform.OS === 'android') {
                const currentForeground = await Location.getForegroundPermissionsAsync();
                foregroundStatus = currentForeground.status;

                if (foregroundStatus !== 'granted') {
                    const foreground = await Location.requestForegroundPermissionsAsync();
                    foregroundStatus = foreground.status;
                }

                if (foregroundStatus === 'granted') {
                    const currentBackground = await Location.getBackgroundPermissionsAsync();
                    backgroundStatus = currentBackground.status;

                    if (backgroundStatus !== 'granted') {
                        await Location.requestBackgroundPermissionsAsync();
                        const updatedBackground = await Location.getBackgroundPermissionsAsync();
                        backgroundStatus = updatedBackground.status;
                    }
                }

            } else if (Platform.OS === 'ios') {
                const background = await Location.requestBackgroundPermissionsAsync();
                backgroundStatus = background.status;
                foregroundStatus = background.status;
            }

            const granted = foregroundStatus === 'granted' &&
                (Platform.OS === 'ios' || backgroundStatus === 'granted');

            await refreshPermissions();

            if (!granted) {
                openDialog({
                    icon: <XIcon color={Colors.primary} />,
                    title: t('location.foreground_service.permission.title'),
                    subtitle: Platform.OS === 'android'
                        ? t('location.foreground_service.permission.android_subtitle')
                        : t('location.foreground_service.permission.subtitle'),
                    closeOnClickOutside: true,
                    cancelButtonText: t('geolocation.settings_dialog_cancel'),
                    successButtonText: t('geolocation.settings_dialog_confirm'),
                    onSuccess: () => {
                        Linking.openSettings().catch(() => {});
                    },
                });
            }

            return granted;

        } catch (error) {
            openDialog({
                icon: <XIcon color={Colors.primary} />,
                title: t('location.foreground_service.permission.error.title'),
                subtitle: t('location.foreground_service.permission.error.subtitle'),
                closeAfterMSeconds: 2000,
                closeOnClickOutside: true,
            });
            return false;
        }
    };

    const startTracking = async (): Promise<StartTrackingResult> => {
        if (!locationPermission.background) {
            const hasPermission = await requestPermissions();
            // requestPermissions already shows a persistent, actionable dialog on denial.
            if (!hasPermission) return { ok: false, reason: 'permission' };
        }

        try {
            const tasks = await TaskManager.getRegisteredTasksAsync();
            if (tasks.some(task => task.taskName === LOCATION_TASK_NAME)) {
                setIsTracking(true);
                return { ok: true };
            }

            await Location?.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 7500,
                distanceInterval: 0,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                    notificationTitle: t('location.foreground_service.active.title'),
                    notificationBody: t('location.foreground_service.active.body'),
                }
            });

            setIsTracking(true);
            return { ok: true };
        } catch (error) {
            setIsTracking(false);


            openDialog({
                icon: <XIcon color={Colors.primary} />,
                title: t('location.foreground_service.tracking.error.title'),
                subtitle: t('location.foreground_service.tracking.error.subtitle'),
                closeAfterMSeconds: 2000,
                closeOnClickOutside: true,
            })
            return { ok: false, reason: 'tracking' };
        }
    };

    const stopTracking = async (): Promise<boolean> => {
        try {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            setIsTracking(false);
            return true;
        } catch (error) {
            return false;
        }
    };

    const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
        if (!locationPermission.foreground) {
            const hasPermission = await requestPermissions();
            if (!hasPermission) return null;
        }

        try {
            // GPS frio: tentar primeiro a última localização conhecida (imediata); caso não exista,
            // pedir com precisão explícita e repetir uma vez. Evita falhas intermitentes no arranque.
            let location = await Location.getLastKnownPositionAsync();
            if (!location) {
                try {
                    location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                } catch (_e) {
                    location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                }
            }
            if (!location) return null;

            await api.put(API_ROUTES.VENDOR_UPDATE_LOCATION,{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                device_id: await getDeviceId()
            })

            setLastLocation(location);
            return location;
        } catch (error) {
            return null;
        }
    };

    return (
        <LocationContext.Provider
            value={{
                locationPermission,
                permissionsChecked,
                isTracking,
                lastLocation,
                requestPermissions,
                startTracking,
                stopTracking,
                getCurrentLocation,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = (): LocationContextType => {
    const context = useContext(LocationContext);

    if (!context) {
        throw new Error('useLocation must be used within LocationProvider');
    }

    return context;
};

export {LOCATION_TASK_NAME};
