import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { useDialog } from '@/contexts/DialogContext';
import { useLocation } from '@/contexts/LocationContext';
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
      openDialog({
        icon: React.createElement(XIcon, { color: Colors.primary }),
        title: t('session.status.blocked_title'),
        subtitle: t('session.status.blocked_subtitle'),
        closeOnClickOutside: true,
      });
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
