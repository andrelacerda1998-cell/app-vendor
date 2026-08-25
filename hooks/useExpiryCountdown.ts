import { useEffect, useMemo, useState } from 'react';

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
  const [now, setNow] = useState(() => Date.now());

  const target = useMemo(() => {
    if (!expiresAt) return 0;
    const parsed = new Date(expiresAt).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }, [expiresAt]);

  const remainingMs = target ? Math.max(0, target - now) : 0;
  const expired = target > 0 && remainingMs === 0;

  // Ao segundo, sempre. Um contador que salta de minuto em minuto parece
  // parado — e é a sensação de estar a correr que faz alguém responder agora
  // em vez de logo.
  useEffect(() => {
    if (!target || expired) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target, expired]);

  /**
   * Unidade sempre explícita — "28m 45s" e nunca "28:45".
   *
   * Dois pontos leem-se como HORA DO DIA, e numa app cheia de horários de
   * serviços isso é uma confusão à espera de acontecer: "28:45" não existe,
   * mas "15:00" existe, e o olho não distingue os dois num relance.
   */
  const label = useMemo(() => {
    if (!target) return null;
    const total = Math.floor(remainingMs / 1000);

    if (total >= 3600) {
      const h = Math.floor(total / 3600);
      return `${h}h ${pad(Math.floor((total % 3600) / 60))}m`;
    }
    if (total >= 60) {
      return `${Math.floor(total / 60)}m ${pad(total % 60)}s`;
    }
    return `${total}s`;
  }, [target, remainingMs]);

  return {
    label,
    expired,
    /** Último minuto: é quando passa a ser uma decisão a tomar já. */
    urgent: remainingMs > 0 && remainingMs <= 60_000,
  };
}

export default useExpiryCountdown;
