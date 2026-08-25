import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Quanto falta até uma janela de resposta fechar, em texto legível.
 *
 * Partilhado entre o cartão do pedido e o atalho da Home para os dois nunca
 * discordarem — ver dois números diferentes para a mesma coisa mina a confiança
 * no contador todo.
 *
 * Nunca devolve algo como "18:44": isso lê-se como HORA DO DIA, perigoso numa
 * app cheia de horários de serviços. A unidade é sempre explícita.
 */
export function useExpiryCountdown(expiresAt?: string | null) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  const target = useMemo(() => {
    if (!expiresAt) return 0;
    const parsed = new Date(expiresAt).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }, [expiresAt]);

  const remainingMs = target ? Math.max(0, target - now) : 0;
  const expired = target > 0 && remainingMs === 0;

  // Ao segundo só no último minuto: acima disso o segundo a mexer é ruído que
  // gasta bateria sem ajudar a decidir.
  useEffect(() => {
    if (!target || expired) return;
    const fine = remainingMs < 60_000;
    const id = setInterval(() => setNow(Date.now()), fine ? 1000 : 20_000);
    return () => clearInterval(id);
  }, [target, expired, remainingMs]);

  const label = useMemo(() => {
    if (!target) return null;
    const total = Math.floor(remainingMs / 1000);

    if (total >= 3600) {
      const h = Math.floor(total / 3600);
      return t('matching.invitation.window_hours', { hours: h, minutes: pad(Math.floor((total % 3600) / 60)) });
    }
    if (total >= 60) {
      return t('matching.invitation.window_minutes', { count: Math.ceil(total / 60) });
    }
    return t('matching.invitation.window_seconds', { count: total });
  }, [target, remainingMs, t]);

  return {
    label,
    expired,
    /** Último minuto: é quando passa a ser uma decisão a tomar já. */
    urgent: remainingMs > 0 && remainingMs <= 60_000,
  };
}

export default useExpiryCountdown;
