import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useService } from '@/contexts/ServiceContext';
import { ONGOING_CHANNEL_ID } from '@/contexts/NotificationsContext';
import { ServiceStatus } from '@/types/services';

/**
 * Notificação fixa enquanto o serviço decorre: cliente, tipo de serviço e a
 * que horas termina o tempo estimado.
 *
 * Serve o caso real do técnico: está de mãos ocupadas, o telemóvel no bolso ou
 * pousado, e quer saber de relance quanto falta sem desbloquear e abrir a app.
 *
 * LIMITE CONHECIDO — não conta ao segundo. Uma notificação não tem contador
 * vivo: teria de ser reescrita a cada segundo, o que gasta bateria e faz a
 * barra piscar. Por isso mostra a HORA DE FIM ("termina às 15:45"), que não
 * precisa de atualização nenhuma para continuar correta. O contador ao segundo
 * é o que a Live Activity do iOS traz (passo seguinte); esta versão funciona
 * hoje, nas duas plataformas e sem código nativo.
 */
const ONGOING_ID = 'ongoing-service';

export function useOngoingServiceNotification() {
  const { t } = useTranslation();
  const { openService } = useService();
  const shownForRef = useRef<string | null>(null);

  const svc: any = openService;
  const isRunning = svc?.status === ServiceStatus.ARRIVED;
  const serviceId = svc?.id ? String(svc.id) : null;
  const customer = svc?.customer?.name ?? '';
  const serviceName = svc?.service_type?.name ?? '';
  const startedAt = svc?.arrived_at ?? null;
  const estimated = Number(svc?.service_type?.time);

  // Hora de fim prevista — o que torna a notificação útil sem a reescrever.
  const endsAtLabel = (() => {
    if (!startedAt || !Number.isFinite(estimated) || estimated <= 0) return null;
    const end = new Date(new Date(startedAt).getTime() + estimated * 60000);
    if (isNaN(end.getTime())) return null;
    return end.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  })();

  useEffect(() => {
    let cancelled = false;

    const dismiss = async () => {
      try {
        await Notifications.dismissNotificationAsync(ONGOING_ID);
      } catch {
        // Já não existia — nada a fazer.
      }
      shownForRef.current = null;
    };

    (async () => {
      if (!isRunning || !serviceId) {
        if (shownForRef.current) await dismiss();
        return;
      }

      // Assinatura do conteúdo: só se reescreve quando algo muda mesmo. Sem
      // isto, cada render da app repunha a notificação e ela saltava para o
      // topo da barra sem motivo.
      const signature = [serviceId, customer, serviceName, endsAtLabel].join('|');
      if (shownForRef.current === signature) return;

      const body = [
        serviceName,
        endsAtLabel ? t('ongoing_service.ends_at', { time: endsAtLabel }) : null,
      ].filter(Boolean).join(' · ');

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: ONGOING_ID,
          content: {
            title: customer || t('ongoing_service.title_fallback'),
            body,
            sticky: true,      // Android: não sai ao deslizar
            autoDismiss: false,
            sound: false,      // silenciosa: é informação, não alerta
            priority: Notifications.AndroidNotificationPriority.LOW,
            ...(Platform.OS === 'android' ? { channelId: ONGOING_CHANNEL_ID } : {}),
            data: { open_type: 'service', open_id: serviceId },
          },
          trigger: null,       // imediata
        });
        if (!cancelled) shownForRef.current = signature;
      } catch {
        // Sem permissão de notificações: o ecrã do serviço continua a ser a
        // fonte de verdade; não vale a pena incomodar o técnico por isto.
      }
    })();

    return () => { cancelled = true; };
  }, [isRunning, serviceId, customer, serviceName, endsAtLabel, t]);

  // Ao desmontar (logout, fecho), garante que não fica uma notificação órfã.
  useEffect(() => {
    return () => {
      Notifications.dismissNotificationAsync(ONGOING_ID).catch(() => {});
    };
  }, []);
}

export default useOngoingServiceNotification;
