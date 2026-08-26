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
export function useExpiryCountdown(expiresAt?: string | null, startedAt?: string | null) {
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

  const start = useMemo(() => {
    if (!startedAt) return 0;
    const parsed = new Date(startedAt).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }, [startedAt]);

  /**
   * Fração da janela que AINDA falta, de 1 a 0.
   *
   * Serve para uma barra que se esvazia: a proporção diz num relance o que o
   * número sozinho não diz — "23m" é muito ou pouco depende da janela ser de
   * 30 minutos ou de 60 segundos.
   */
  const remainingRatio = useMemo(() => {
    if (!target || !start || target <= start) return null;
    return Math.max(0, Math.min(1, remainingMs / (target - start)));
  }, [target, start, remainingMs]);

  /**
   * Quão urgente é responder, em três degraus.
   *
   * A cor progride ao longo de TODA a janela e não só no último minuto, porque
   * responder cedo é melhor para o cliente: quanto mais depressa alguém se
   * disponibiliza, mais cedo ele escolhe e menos tempo fica à espera. Deixar o
   * aviso para o fim seria premiar quem responde tarde.
   *
   * Quando não há `startedAt` não há proporção, e cai-se no tempo absoluto —
   * pior, mas melhor do que não dizer nada.
   */
  const tone: 'calm' | 'warning' | 'critical' = useMemo(() => {
    if (!target) return 'calm';

    if (remainingRatio !== null) {
      if (remainingRatio <= 0.2) return 'critical';
      if (remainingRatio <= 0.5) return 'warning';
      return 'calm';
    }

    if (remainingMs <= 60_000) return 'critical';
    if (remainingMs <= 5 * 60_000) return 'warning';

    return 'calm';
  }, [target, remainingRatio, remainingMs]);

  return {
    label,
    remainingRatio,
    tone,
    expired,
    /** Último minuto: é quando passa a ser uma decisão a tomar já. */
    urgent: remainingMs > 0 && remainingMs <= 60_000,
  };
}

export default useExpiryCountdown;
