import { useEffect, useRef, useState } from 'react';
import {Platform, Text} from 'react-native';
import {Redirect, router, SplashScreen, Stack} from 'expo-router';
import {useSession} from '@/contexts/SessionContext';
import {Colors} from '@/constants/Colors';
import useEcho from '@/hooks/echo';
import {jwtDecode} from 'jwt-decode';
import {useDialog} from "@/contexts/DialogContext";
import {useService} from "@/contexts/ServiceContext";
import {useApi} from "@/contexts/ApiContext";
import CheckMark from "@/assets/icons/check-mark";
import {ServiceInterface} from "@/types/services";
import {useTranslation} from "react-i18next";
import {useAppStateStatus} from "@/contexts/AppStateStatusContext";
import Echo from "laravel-echo";
import {useSchedule} from "@/contexts/ScheduleContext";
import useOngoingServiceNotification from "@/hooks/useOngoingServiceNotification";
import { useForceDarkTheme } from '@/contexts/ThemeContext';

export default function AppLayout() {
    // Já dentro da app, a escolha de tema do técnico volta a mandar: o escuro
    // forçado é só do fluxo de autenticação (ver useForceDarkTheme).
    useForceDarkTheme(false);

    const { t } = useTranslation();
    const { session, isLoading, vendorData, setWallet, vendorStatus, setVendorStatus, fetchAndSaveUserData, getWalletInfo } = useSession();
    const { openDialog } = useDialog();
    const echo: Echo<any> = useEcho();
    const { openService, setOpenService, setPendingService, pendingService, getOpenService, getPendingService, getPendingServices, getHistoryServices, incrementUnreadMessages } = useService();
    const { api } = useApi();
    const { appStateStatus } = useAppStateStatus();
    const { setPendingScheduleServices, fetchPendingScheduledService, fetchScheduledServices, getScheduledServices, getPendingScheduleService } = useSchedule();

    // Notificação fixa do serviço em curso — aqui e não na Home para
    // continuar visível enquanto o técnico navega pela app.
    useOngoingServiceNotification();

    // Prevents re-running the full refresh cycle when vendorData updates mid-cycle
    // (e.g. fetchAndSaveUserData() causes vendorData to change, which would re-trigger this effect)
    const didFetchRef = useRef(false);
    // Incrementado quando o arranque falha, para repetir o carregamento.
    const [bootRetry, setBootRetry] = useState(0);

    useEffect(() => {
        if (appStateStatus !== "active") {
            didFetchRef.current = false;
            return;
        }
        if (!session || !vendorData) return;
        if (didFetchRef.current) return;
        didFetchRef.current = true;

        // Se o arranque falhar (rede fraca, servidor lento), libertamos o
        // guarda para uma nova tentativa: senão o técnico fica sem o serviço em
        // curso nem os pedidos até fechar e reabrir a app.
        let retryScheduled = false;
        const retryOnFailure = (e: unknown) => {
            console.error('[AppLayout] falha ao carregar dados iniciais:', e);
            didFetchRef.current = false;
            if (retryScheduled) return;
            retryScheduled = true;
            setTimeout(() => setBootRetry((n) => n + 1), 4000);
        };

        // Carregamento em série e por prioridade. Antes disparavam todos ao mesmo
        // tempo: numa rede fraca competiam entre si e os mais importantes (serviço
        // em curso, pedidos por aceitar) eram os que mais vezes rebentavam o tempo
        // limite — o técnico abria a app e não via o trabalho que tinha em mãos.
        (async () => {
            // 1) Crítico: o que o técnico precisa de ver imediatamente.
            await getOpenService();
            await getPendingService();
            await getPendingServices();

            // 2) Secundário: falhar aqui não deixa a app inutilizável.
            await Promise.resolve(getScheduledServices(vendorData)).catch((e) =>
                console.error('[AppLayout] getScheduledServices falhou:', e));
            await Promise.resolve(getHistoryServices(0)).catch((e) =>
                console.error('[AppLayout] getHistoryServices falhou:', e));

            const schedules = await getPendingScheduleService(vendorData).catch((e) => {
                console.error('[AppLayout] getPendingScheduleService falhou:', e);
                return null;
            });
            // Navigate to first pending schedule if exists and no open/pending service
            if (schedules && schedules.length > 0 && !openService && !pendingService) {
                const firstSchedule = schedules[0];
                router.navigate({
                    pathname: '/(app)/(bottom-sheets)/(services)/schedule-proposal/[scheduleId]',
                    params: {
                        scheduleId: String(firstSchedule?.id),
                        serviceId: firstSchedule?.service_id ? String(firstSchedule.service_id) : undefined,
                    },
                });
            }
        })().catch(retryOnFailure);
        if (
            vendorData.user.phone_number_verified_at === null ||
            vendorData.user.email_verified_at === null ||
            (vendorData.pending_documents?.length ?? 0) > 0
        ) {
            fetchAndSaveUserData();
        }
    }, [appStateStatus, session, vendorData, bootRetry])

    useEffect(() => {
        if (appStateStatus === "active") {
            if (session && (vendorStatus === 'Online' || openService || pendingService)) {
                const token = jwtDecode(session as string);
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
                    channel.error(function (error: any) {
                        console.error('[Socket] erro na subscrição do canal:', error);
                    });
                    channel.listen('.CreateServiceEvent', (data: { serviceDetails: ServiceInterface }) => {
                        setPendingService(data?.serviceDetails);
                        getPendingServices();

                        // Ecrã cheio de pedido a chegar: contagem certa (60 s para imediatos,
                        // 20 min para agendados), vibração e deslizar-para-aceitar. Substitui o
                        // antigo `proposal`, que tinha dois botões com o mesmo peso e um
                        // temporizador fixo de 60 s mesmo para serviços agendados.
                        router.navigate(`/(app)/(modals)/incoming-request/${data?.serviceDetails?.id}`);
                    });
                    channel.listen('.ServiceCanceledEvent', (data: any) => {

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

                        const scheduleDetails = data?.scheduleDetails || {};
                        const scheduleId = scheduleDetails.schedule_id ?? scheduleDetails.id;
                        const socketServiceId = scheduleDetails?.service_id
                            || scheduleDetails?.service?.id
                            || scheduleDetails?.service?.service_id;


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

                        const scheduleDetails = data?.scheduleDetails || {};
                        const scheduleId = scheduleDetails.schedule_id ?? scheduleDetails.id;
                        fetchScheduledServices(String(scheduleId));
                    })
                    channel.listen('.AcceptScheduleEvent', (data: any) => {

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
