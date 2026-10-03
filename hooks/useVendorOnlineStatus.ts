import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { useDialog } from '@/contexts/DialogContext';
import { useLocation } from '@/contexts/LocationContext';
import { useNotificationPermission } from '@/contexts/NotificationsContext';
import { abrirDefinicoesDoSistema } from '@/utils/abrirDefinicoesDoSistema';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Colors } from '@/constants/Colors';
import { getDeviceId } from '@/utils';
import XIcon from '@/assets/icons/x';

/**
 * Estado online/offline do técnico — a lógica que decide se ele recebe pedidos.
 *
 * Extraído do ReceiveRequestsCard (Perfil) para poder viver também no cabeçalho
 * da Home: o interruptor do rendimento estava escondido a três toques de
 * distância, enquanto os Ganhos diziam "fica online para receberes pedidos"
 * sem dizer onde. Duas cópias da mesma lógica divergiriam à primeira alteração.
 */
export const useVendorOnlineStatus = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData, vendorStatus, setVendorStatus } = useSession();
  const { openDialog } = useDialog();
  const { startTracking, stopTracking } = useLocation();
  const { permissionDenied } = useNotificationPermission();

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setIsLoadingStatus(true);
    api.get(API_ROUTES.VENDOR_GET_STATUS)
      .then(async (response: any) => {
        const deviceId = response?.data?.data?.device_id;
        const isOnline = response?.data?.data?.status === 'Online';
        const currentDeviceId = await getDeviceId();

        // Online noutro dispositivo: não se deixa alternar aqui, senão os dois
        // telemóveis lutavam pelo mesmo estado.
        setDisabled(Boolean(deviceId && isOnline && deviceId !== currentDeviceId));
        setVendorStatus(isOnline ? 'Online' : 'Offline');
      })
      .catch(() => {})
      .finally(() => setIsLoadingStatus(false));
  }, []);

  // O perfil ainda não permite receber: não faz sentido "A receber pedidos"
  // verde quando o servidor recusa todos. O botão fica bloqueado e explica.
  const blockedByProfile = vendorData?.can_accept_service === false;

  const toggle = async () => {
    if (blockedByProfile) {
      // Não é um beco: leva diretamente ao sítio que resolve o bloqueio, em vez
      // de só explicar que ele existe.
      router.push('/(app)/(complete-profile)/CompleteProfile');
      return;
    }

    if (vendorStatus === 'Offline' && vendorData?.at_user && vendorData?.at_valid === false) {
      openDialog({
        icon: React.createElement(XIcon, { color: Colors.primary }),
        title: t('errors.go_online_blocked.title'),
        subtitle: t('profile.edit.at_invalid.go_online_blocked'),
        closeOnClickOutside: true,
      });
      return;
    }

    /**
     * SEM NOTIFICAÇÕES NÃO SE VAI ONLINE.
     *
     * A localização já era exigida aqui (o `startTracking` recusa sem ela). As
     * notificações não: o técnico ficava online sem nunca ser avisado de um
     * pedido, e os 120 segundos de cada um passavam sem ele saber.
     */
    if (vendorStatus === 'Offline' && permissionDenied) {
      openDialog({
        icon: React.createElement(XIcon, { color: Colors.primary }),
        title: t('permissions_guard.go_online_title'),
        subtitle: t('permissions_guard.go_online_notifications'),
        successButtonText: t('permissions_guard.open_settings'),
        cancelButtonText: t('common.close'),
        onSuccess: abrirDefinicoesDoSistema,
      });
      return;
    }

    setDisabled(true);
    const deviceId = await getDeviceId();
    let trackingStatus = false;

    if (vendorStatus === 'Offline') {
      const result = await startTracking();
      if (!result.ok) {
        // startTracking já mostrou o diálogo de permissão/erro apropriado.
        setDisabled(false);
        return;
      }
      trackingStatus = result.ok;
    }

    api.put(API_ROUTES.VENDOR_UPDATE_STATUS, {
      status: vendorStatus === 'Online' ? 'Offline' : 'Online',
      device_id: deviceId,
      // O servidor não vê as permissões do telemóvel: diz-lhas a app, para ele
      // poder recusar ir online sem elas (segunda linha, além da de cima).
      // `true` fixo porque, a ir online, só se chega aqui depois de o
      // `startTracking` ter confirmado a localização; a ir offline não conta.
      location_enabled: true,
      notifications_enabled: !permissionDenied,
    })
      .then(() => {
        setVendorStatus(vendorStatus === 'Online' ? 'Offline' : 'Online');
      })
      .catch((error: any) => {
        const subtitle = error?.response?.status === 422
          ? t('errors.account_under_verification')
          : error?.response?.data?.metadata?.message
            || error?.response?.data?.message
            || t('errors.status_update.subtitle');

        openDialog({
          icon: React.createElement(XIcon, { color: Colors.primary }),
          title: t('errors.status_update.title'),
          subtitle,
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
          onClose: () => {
            if (vendorStatus === 'Offline' && trackingStatus) stopTracking();
          },
        });
      })
      .finally(() => setDisabled(false));
  };

  return {
    // Com o perfil incompleto, o técnico NÃO está a receber, esteja o que
    // estiver gravado no servidor: mostrar "online" seria uma promessa falsa.
    isOnline: vendorStatus === 'Online' && !blockedByProfile,
    blocked: blockedByProfile,
    isLoadingStatus,
    disabled: isLoadingStatus || disabled,
    toggle,
  };
};

export default useVendorOnlineStatus;
