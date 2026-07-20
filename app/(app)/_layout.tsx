import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Platform, Text} from 'react-native';
import {Redirect, router, SplashScreen, Stack} from 'expo-router';
import {useSession} from '@/contexts/SessionContext';
import {Colors} from '@/constants/Colors';
import useEcho from '@/hooks/echo';
import {jwtDecode} from 'jwt-decode';
import {useDialog} from "@/contexts/DialogContext";
import {useService} from "@/contexts/ServiceContext";
import {useApi} from "@/contexts/ApiContext";
import {API_ROUTES} from "@/constants/ApiRoutes";
import CheckMark from "@/assets/icons/check-mark";
import {ServiceInterface} from "@/types/services";
import {useTranslation} from "react-i18next";
import XIcon from "@/assets/icons/x";
import packageInfo from '@/package.json';
import {useAppStateStatus} from "@/contexts/AppStateStatusContext";
import Echo from "laravel-echo";
import {useSchedule} from "@/contexts/ScheduleContext";
import {ScheduledServiceInterface} from "@/types/schedule";

export default function AppLayout() {
    const { t } = useTranslation();
    const { session, isLoading, vendorData, setWallet, vendorStatus, setVendorStatus, fetchAndSaveUserData, getWalletInfo } = useSession();
    const { openDialog } = useDialog();
    const echo: Echo<any> = useEcho();
    const { openService, setOpenService, setPendingService, pendingService, getOpenService, getPendingService, getPendingServices, getHistoryServices, incrementUnreadMessages } = useService();
    const { api } = useApi();
    const { appStateStatus } = useAppStateStatus();
    const { setPendingScheduleServices, fetchPendingScheduledService, fetchScheduledServices, getScheduledServices, getPendingScheduleService } = useSchedule();

    // Prevents re-running the full refresh cycle when vendorData updates mid-cycle
    // (e.g. fetchAndSaveUserData() causes vendorData to change, which would re-trigger this effect)
    const didFetchRef = useRef(false);

    useEffect(() => {
        if (appStateStatus !== "active") {
            didFetchRef.current = false;
            return;
        }
        if (!session || !vendorData) return;
        if (didFetchRef.current) return;
        didFetchRef.current = true;

        getOpenService();
        getPendingService();
        getPendingServices();
        getHistoryServices(0);
        getScheduledServices(vendorData);
        getPendingScheduleService(vendorData).then((schedules) => {
            console.log('[AppLayout] Pending schedules fetched:', schedules?.length);
            // Navigate to first pending schedule if exists and no open/pending service
            if (schedules && schedules.length > 0 && !openService && !pendingService) {
                const firstSchedule = schedules[0];
                const scheduleId = firstSchedule?.id;
                const serviceId = firstSchedule?.service_id;
                console.log('[AppLayout] Navigating to first pending schedule:', scheduleId, serviceId);
                router.navigate({
                    pathname: '/(app)/(bottom-sheets)/(services)/schedule-proposal/[scheduleId]',
                    params: {
                        scheduleId: String(scheduleId),
                        serviceId: serviceId ? String(serviceId) : undefined,
                    },
                });
            }
        }).catch((e) => {
            console.error('[AppLayout] getPendingScheduleService failed:', e);
        });
        if (
            vendorData.user.phone_number_verified_at === null ||
            vendorData.user.email_verified_at === null ||
            (vendorData.pending_documents?.length ?? 0) > 0
        ) {
            fetchAndSaveUserData();
        }
    }, [appStateStatus, session, vendorData])

    useEffect(() => {
        if (appStateStatus === "active") {
            if (session && (vendorStatus === 'Online' || openService || pendingService)) {
                const token = jwtDecode(session as string);
                console.log('Subscribing to channel service.vendor.' + token.sub);
                subscribeToSearchServicesChannel(token.sub);
                return () => {
                    if (echo) {
                        echo.leaveChannel(`service.vendor.${token?.sub}`);
                    }
                };
            }
        }
    }, [echo, session, appStateStatus, vendorStatus]);

    useEffect(() => {
        if (session && vendorStatus === 'Offline' && !openService && !pendingService && echo) {
            const token = jwtDecode(session as string);
            echo.leaveChannel(`service.vendor.${token?.sub}`);
        }
    }, [vendorStatus]);

    // Subscribe to service chat channel for unread messages indicator
    useEffect(() => {
        if (!echo || !openService?.id || !vendorData?.user?.id) return;

        const channel = echo.private(`common.services.${openService.id}`);
        if (!channel) return;

        const handleNewMessage = (data: { message: string }) => {
            try {
                const { user_id } = JSON.parse(data.message);
                // Only increment if message is from customer (not from vendor)
                if (user_id !== vendorData?.user?.id) {
                    incrementUnreadMessages();
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        channel.subscribed(() => {
            channel.listen('.NewMessageEvent', handleNewMessage);
        });

        return () => {
            channel.stopListening('.NewMessageEvent');
        };
    }, [echo, openService?.id, vendorData?.user?.id]);

    function subscribeToSearchServicesChannel(userId: any) {
        if (echo) {
            const channel = echo.private(`service.vendor.${userId}`);

            if (channel) {
                channel.subscribed(() => {
                    console.log('Successfully subscribed to channel:', channel.name);
                    channel.error(function (error: any) {
                        console.log('Channel subscription error:', error);
                        // console.log(error);
                    });
                    channel.listen('.CreateServiceEvent', (data: { serviceDetails: ServiceInterface }) => {
                        console.log('[Socket] .CreateServiceEvent received:', data);
                        console.log('[Socket] Calling getPendingServices...');

                        setPendingService(data?.serviceDetails);
                        getPendingServices();
                        console.log('[Socket] getPendingServices called');

                        router.navigate(`/(app)/(bottom-sheets)/(services)/proposal/${data?.serviceDetails?.id}`);
                    });
                    channel.listen('.ServiceCanceledEvent', (data: any) => {
                        // console.log(data, 'data on ServiceCanceledEvent on layout of vendor');

                        setOpenService(null);
                        setPendingService(null);
                        getPendingServices();

                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.push('/(app)/(tabs)/home');
                        }

                        openDialog({
                            title: t('services.wait_accept.canceled.title'),
                            subtitle: t('services.wait_accept.canceled.subtitle'),
                            closeAfterMSeconds: 3000,
                            closeOnClickOutside: true,
                        })
                    });
                    channel.listen('.ServiceTimeoutEvent', (data: any) => {
                        console.log(data, 'data on ServiceTimeoutEvent on layout of vendor');

                        setPendingScheduleServices((prev) => (prev ?? []).filter(s => s.service_id !== data?.service?.id));

                        setPendingService(null);
                        getPendingServices();
                        setVendorStatus('Offline');

                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.push('/(app)/(tabs)/home');
                        }

                        openDialog({
                            title: t('services.wait_accept.timeout.title'),
                            subtitle: t('services.wait_accept.timeout.subtitle'),
                            closeAfterMSeconds: 3000,
                            closeOnClickOutside: true,
                        })
                    })
                    channel.listen('.ServiceClosedEvent', (data: any) => {
                        // console.log(data, 'data on ServiceClosedEvent on layout of vendor');

                        const updatedWallet = data?.service?.vendor?.wallet;

                        if (updatedWallet) {
                            setWallet(updatedWallet)
                        } else {
                            fetchAndSaveUserData();
                        }
                        setOpenService(null);

                        openDialog({
                            icon: <CheckMark color={Colors.primary}/>,
                            title: t('services.wait_accept.closed.title'),
                            subtitle: t('services.wait_accept.closed.subtitle'),
                            closeAfterMSeconds: 3000,
                            closeOnClickOutside: true,
                        })

                        // router.push(`/(app)/(bottom-sheets)/(services)/rate/${data.service.id}`)
                        // router.push(`/(app)/(bottom-sheets)/(services)/rate/${data.service.id}?serviceRate=null&customerName=${data.service.customer.name}`);
                        router.push({
                            pathname: "/(app)/(bottom-sheets)/(services)/rate/[serviceId]",
                            params: {
                                serviceId: data?.service?.id,
                                service: JSON.stringify(data?.service),
                            },
                        })

                        getHistoryServices(0);
                    })
                    channel.listen(".UpdateLocationEvent", (data: any) => {
                        setOpenService(data?.service);
                    })
                    channel.listen('.CreateScheduleEvent', (data: any) => {
                        console.log('created schedule event', data);

                        const scheduleDetails = data?.scheduleDetails || {};
                        const scheduleId = scheduleDetails.schedule_id ?? scheduleDetails.id;
                        const socketServiceId = scheduleDetails?.service_id
                            || scheduleDetails?.service?.id
                            || scheduleDetails?.service?.service_id;

                        console.log('Fetching pending scheduled service with scheduleId:', scheduleId);

                        fetchPendingScheduledService(String(scheduleId));
                        getPendingServices(); // Update the pending services list
                        router.navigate({
                            pathname: "/(app)/(bottom-sheets)/(services)/schedule-proposal/[scheduleId]",
                            params: {
                                scheduleId: String(scheduleId),
                                serviceId: socketServiceId ? String(socketServiceId) : undefined,
                            },
                        });
                    })
                    channel.listen('.ServiceScheduledEvent', (data: any) => {
                        console.log('service scheduled event', data);

                        const scheduleDetails = data?.scheduleDetails || {};
                        const scheduleId = scheduleDetails.schedule_id ?? scheduleDetails.id;
                        fetchScheduledServices(String(scheduleId));
                    })
                    channel.listen('.AcceptScheduleEvent', (data: any) => {
                        console.log('[Socket] .AcceptScheduleEvent received:', data);

                        if (vendorData) {
                            getScheduledServices(vendorData);
                        }

                        const scheduleId = data?.scheduleDetails?.schedule_id
                            ?? data?.scheduleDetails?.id
                            ?? data?.schedule_id
                            ?? data?.id;

                        if (scheduleId) {
                            setPendingScheduleServices((prev) =>
                                (prev ?? []).filter(s => Number(s.id) !== Number(scheduleId))
                            );
                        }
                    })
                });
            }
        }
    }

    if (isLoading) {
        return SplashScreen.preventAutoHideAsync();
    }

    if (!session) {
        return <Redirect href="/"/>;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(tabs)"/>
            <Stack.Screen
                name="(urgent-service)"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="(modals)"
                options={{
                    presentation: 'transparentModal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="(bottom-sheets)/areas/index"
                options={{
                    presentation: 'containedTransparentModal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="(bottom-sheets)/(services)/proposal/[serviceId]"
                options={{
                    presentation: 'containedTransparentModal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="(bottom-sheets)/(services)/schedule-proposal/[scheduleId]"
                options={{
                    presentation: 'containedTransparentModal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="(bottom-sheets)/(services)/rate/[serviceId]"
                options={{
                    presentation: 'containedTransparentModal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="(bottom-sheets)/(wallet)/history/index"
                options={{
                    presentation: 'containedTransparentModal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="(services)"
                options={{
                    // presentation: 'containedTransparentModal',
                    // animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="(complete-profile)/CompleteProfile"
            />
        </Stack>
    );
}
