import { useCallback, useEffect, useState } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';

/**
 * Dias de indisponibilidade pontual (folga, doença, férias).
 *
 * A disponibilidade da app é SEMANAL e fixa. Sem isto, um técnico que ficasse
 * doente numa quarta só tinha duas saídas: desligar a quarta para sempre, ou
 * recusar os pedidos um a um — e a taxa de aceitação dele caía por algo que
 * não é recusa.
 */
export const useUnavailableDays = () => {
  const { api } = useApi();
  const [days, setDays] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get(API_ROUTES.VENDOR_UNAVAILABLE_DAYS);
      const list = (r?.data?.data?.days ?? []) as { day: string }[];
      // O backend devolve ISO; guardamos só YYYY-MM-DD para comparar com as
      // chaves de dia da Agenda sem tropeçar em fusos.
      setDays(list.map((d) => String(d.day).split('T')[0]));
    } catch {
      // Silencioso de propósito: é informação acessória da fita da semana.
      // Uma falha aqui não pode partir a Agenda.
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const isUnavailable = useCallback((dayKey: string) => days.includes(dayKey), [days]);

  const toggle = useCallback(async (dayKey: string) => {
    if (busy) return;
    setBusy(true);
    const wasUnavailable = days.includes(dayKey);
    // Otimista: a fita reage ao toque e reverte-se se o servidor recusar.
    setDays((prev) => (wasUnavailable ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]));
    try {
      if (wasUnavailable) {
        await api.delete(API_ROUTES.VENDOR_UNAVAILABLE_DAY_DELETE(dayKey));
      } else {
        await api.post(API_ROUTES.VENDOR_UNAVAILABLE_DAYS, { day: dayKey });
      }
    } catch {
      setDays((prev) => (wasUnavailable ? [...prev, dayKey] : prev.filter((d) => d !== dayKey)));
    } finally {
      setBusy(false);
    }
  }, [api, busy, days]);

  return { isUnavailable, toggle, busy, reload: load };
};

export default useUnavailableDays;
