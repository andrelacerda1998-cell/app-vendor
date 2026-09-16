import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useService } from '@/contexts/ServiceContext';
import { useAppStateStatus } from '@/contexts/AppStateStatusContext';
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

const hhmm = (d: Date) =>
  d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

export function useOngoingServiceNotification() {
  const { t } = useTranslation();
  const { openService } = useService();
  const { appStateStatus } = useAppStateStatus();
  const shownForRef = useRef<string | null>(null);

  const svc: any = openService;
  const isRunning = svc?.status === ServiceStatus.ARRIVED;
  const serviceId = svc?.id ? String(svc.id) : null;
  const customer = svc?.customer?.name ?? '';
  const serviceName = svc?.service_type?.name ?? '';
  const startedAt = svc?.arrived_at ?? null;
  const estimated = Number(svc?.service_type?.time);

  // Hora de fim prevista — o facto que não envelhece.
  //
  // NÃO mostramos "faltam 1h27". Com a app em segundo plano os temporizadores
  // de JS param, por isso um número desses ficaria congelado no valor que
  // tinha quando o técnico bloqueou o ecrã — mentiria com ar de verdade.
  // "Termina às 19:10" continua correto sem ninguém lhe tocar. O contador a
  // mexer só é possível com a Live Activity.
  const endsAt = (() => {
    if (!startedAt || !Number.isFinite(estimated) || estimated <= 0) return null;
    const end = new Date(new Date(startedAt).getTime() + estimated * 60000);
    return isNaN(end.getTime()) ? null : end;
  })();
  const endsAtLabel = endsAt ? hhmm(endsAt) : null;

  /**
   * O tempo estimado ja passou?
   *
   * Sem isto a notificacao dizia "Termina as 10:23" as 10:56 — uma frase no
   * futuro sobre uma hora que ja passou. Nao e so inexato: esconde do tecnico
   * precisamente o momento em que ele tem de decidir alguma coisa (pedir mais
   * tempo ou concluir).
   *
   * Avaliado no momento em que a notificacao e escrita. Como ela e reemitida
   * de cada vez que a app vai para segundo plano, apanha a mudanca na
   * proxima vez que o tecnico guarda o telemovel.
   */
  const overdue = !!endsAt && endsAt.getTime() < Date.now();

  // Sem estimativa de duração (services_types.time em falta) mostramos a hora
  // de início: menos útil, mas nunca uma notificação vazia.
  const startedAtLabel = (() => {
    if (!startedAt) return null;
    const d = new Date(startedAt);
    return isNaN(d.getTime()) ? null : hhmm(d);
  })();

  // O iOS só mostra no ecrã bloqueado as notificações chegadas DEPOIS do
  // último desbloqueio: uma entregue com a app aberta vai direta para o
  // histórico e o técnico nunca a vê ao acordar o telemóvel. Por isso
  // reemitimo-la de cada vez que a app sai de primeiro plano — que é
  // exatamente quando ele guarda o telemóvel e passa a precisar dela.
  const background = appStateStatus !== undefined && appStateStatus !== 'active';
  const prevBackgroundRef = useRef(background);
  useEffect(() => {
    const wentToBackground = background && !prevBackgroundRef.current;
    prevBackgroundRef.current = background;
    if (wentToBackground) shownForRef.current = null;
  }, [background]);

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
      const signature = [serviceId, customer, serviceName, endsAtLabel, startedAtLabel, overdue].join('|');
      if (shownForRef.current === signature) return;

      // Hierarquia: o serviço identifica o trabalho, o ESTADO diz o que aquilo
      // é, o cliente identifica a casa, a hora diz quando acaba.
      //
      // Faltava o estado. Sem ele, "Reparar uma torneira a pingar / Marta
      // Silva / Termina às 10:23" lê-se, de relance na barra, como um pedido
      // novo ou uma marcação — e não como o trabalho que ele tem entre mãos.
      //
      // No iOS o `subtitle` é uma linha própria a negrito: leva o estado e o
      // cliente. No Android não há subtitle, por isso ambos vão no corpo.
      const timeLine = overdue
        ? t('ongoing_service.overdue', { time: endsAtLabel })
        : endsAtLabel
          ? t('ongoing_service.ends_at', { time: endsAtLabel })
          : startedAtLabel
            ? t('ongoing_service.started_at', { time: startedAtLabel })
            : null;

      const stateLine = overdue
        ? t('ongoing_service.state_overdue')
        : t('ongoing_service.state_running');

      const title = serviceName || t('ongoing_service.title_fallback');
      const isIOS = Platform.OS === 'ios';
      const subtitle = [stateLine, customer].filter(Boolean).join(' · ');
      // Sem "Toca para abrir": tocar numa notificação para a abrir é a coisa
      // mais sabida de um telemóvel, e a linha gastava metade da largura.
      const body = (isIOS ? [timeLine] : [subtitle, timeLine])
        .filter(Boolean)
        .join(' · ');

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: ONGOING_ID,
          content: {
            title,
            ...(isIOS && subtitle ? { subtitle } : {}),
            body,
            sticky: true,      // Android: não sai ao deslizar
            autoDismiss: false,
            sound: false,      // silenciosa: é informação, não alerta
            priority: Notifications.AndroidNotificationPriority.LOW,
            ...(isIOS ? {} : { channelId: ONGOING_CHANNEL_ID }),
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
  }, [isRunning, serviceId, customer, serviceName, endsAtLabel, startedAtLabel, overdue, background, t]);

  // Ao desmontar (logout, fecho), garante que não fica uma notificação órfã.
  useEffect(() => {
    return () => {
      Notifications.dismissNotificationAsync(ONGOING_ID).catch(() => {});
    };
  }, []);
}

export default useOngoingServiceNotification;
