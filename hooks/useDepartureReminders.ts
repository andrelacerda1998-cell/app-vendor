import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';

/**
 * Aviso "está na hora de sair".
 *
 * Agenda uma notificação LOCAL 30 minutos antes do início de cada serviço
 * agendado, para o técnico se deslocar a tempo a casa do cliente. Sendo local,
 * fica entregue ao sistema operativo e dispara mesmo com a app fechada — não
 * depende de push do backend.
 *
 * A cada mudança na lista de agendamentos, cancelamos os avisos que criámos e
 * voltamos a agendar a partir da lista atual: assim um serviço cancelado ou
 * reagendado nunca deixa um aviso "fantasma" para trás.
 *
 * Respeita a preferência `schedule_reminders` (Definições → Notificações): se
 * estiver desligada, nenhum aviso é agendado.
 */
const LEAD_MINUTES = 30;
const ID_PREFIX = 'departure-';

/** Junta o dia (YYYY-MM-DD) e a hora (HH:mm) num Date local. */
function serviceStartDate(s: any): Date | null {
  const day = String(s?.schedule?.scheduled_day ?? '').split('T')[0];
  const time = String(s?.schedule?.scheduled_time?.start ?? '').slice(0, 5);
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

async function cancelOurReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => String(n.identifier ?? '').startsWith(ID_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // Sem permissão / API indisponível: nada a cancelar.
  }
}

export function useDepartureReminders() {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();
  const { api } = useApi();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Preferência do técnico manda. Por omissão (chave ausente) assumimos
      // ligado — é um lembrete operacional útil, não uma campanha.
      let enabled = true;
      try {
        const r = await api.get(API_ROUTES.VENDOR_NOTIFICATION_SETTINGS);
        const prefs = r?.data?.data?.notification_preferences ?? {};
        if (prefs.schedule_reminders === false) enabled = false;
      } catch {
        // Falha a ler preferências: mantemos o lembrete (útil por defeito).
      }
      if (cancelled) return;

      // Parte-se sempre do zero para não acumular avisos de serviços que já
      // saíram da lista.
      await cancelOurReminders();
      if (cancelled || !enabled) return;

      const now = Date.now();
      const list = scheduledServicesData ?? [];

      for (const s of list) {
        const start = serviceStartDate(s);
        if (!start) continue;
        const triggerAt = start.getTime() - LEAD_MINUTES * 60 * 1000;
        // Só faz sentido no futuro: se a hora de sair já passou, não agenda.
        if (triggerAt <= now) continue;

        const serviceName = s?.service_type?.name ?? t('departure_reminder.fallback_service');
        const startLabel = String(s?.schedule?.scheduled_time?.start ?? '').slice(0, 5);

        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `${ID_PREFIX}${s?.service_id}`,
            content: {
              title: t('departure_reminder.title'),
              body: t('departure_reminder.body', { service: serviceName, time: startLabel }),
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(triggerAt),
            },
          });
        } catch {
          // Um agendamento que falhe não deve impedir os restantes.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scheduledServicesData, api, t]);
}
