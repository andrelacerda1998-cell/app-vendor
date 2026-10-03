import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { useLocation } from '@/contexts/LocationContext';
import { useNotificationPermission } from '@/contexts/NotificationsContext';
import { useSession } from '@/contexts/SessionContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { getDeviceId } from '@/utils';
import { abrirDefinicoesDoSistema } from '@/utils/abrirDefinicoesDoSistema';

/**
 * SEM LOCALIZAÇÃO OU SEM NOTIFICAÇÕES, O TÉCNICO NÃO RECEBE PEDIDOS.
 *
 * Ir online já exigia a localização. Mas desligá-la DEPOIS -- ou desligar as
 * notificações -- não mudava nada: o técnico continuava online, o matching
 * continuava a mandar-lhe pedidos, e ele não os via. Sem notificações não sabe
 * que chegaram; sem localização o cliente não o vê a caminho. Cada pedido
 * perdido assim baixava-lhe a taxa de aceitação por uma coisa que ele nem sabia
 * que estava a acontecer.
 *
 * Montado UMA vez, no layout autenticado. O `useVendorOnlineStatus` vive em
 * vários ecrãs ao mesmo tempo, e pôr isto lá era mandar o mesmo "offline" duas
 * ou três vezes.
 *
 * Se o servidor recusar (há um serviço em curso), não se insiste: não se tira
 * ninguém a meio de um trabalho. Com um serviço aberto o matching já não lhe
 * manda pedidos novos.
 */
const GuardaDasPermissoes = () => {
    const { t } = useTranslation();
    const { api } = useApi();
    const { openDialog } = useDialog();
    const { vendorStatus, setVendorStatus } = useSession();
    const { locationPermission, permissionsChecked, stopTracking } = useLocation();
    const { permissionDenied } = useNotificationPermission();
    const aTirar = useRef(false);

    // Antes de a verificação da localização acabar não se conclui nada: no
    // arranque o `foreground` começa a `false` por omissão, não por recusa.
    const semLocalizacao = permissionsChecked && !locationPermission.foreground;
    const semNotificacoes = permissionDenied;

    useEffect(() => {
        if (vendorStatus !== 'Online') return;
        if (!semLocalizacao && !semNotificacoes) return;
        if (aTirar.current) return;

        aTirar.current = true;
        (async () => {
            try {
                const deviceId = await getDeviceId();
                await api.put(API_ROUTES.VENDOR_UPDATE_STATUS, { status: 'Offline', device_id: deviceId });
                setVendorStatus('Offline');
                stopTracking();

                openDialog({
                    title: t('permissions_guard.went_offline_title'),
                    subtitle: semLocalizacao
                        ? t('permissions_guard.went_offline_location')
                        : t('permissions_guard.went_offline_notifications'),
                    successButtonText: t('permissions_guard.open_settings'),
                    cancelButtonText: t('common.close'),
                    onSuccess: abrirDefinicoesDoSistema,
                });
            } catch {
                // Serviço em curso, ou sem rede: fica como está. Ver o comentário acima.
            } finally {
                aTirar.current = false;
            }
        })();
    }, [vendorStatus, semLocalizacao, semNotificacoes]);

    return null;
};

export default GuardaDasPermissoes;
