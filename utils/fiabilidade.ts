import type { ReliabilitySummary } from '@/types/session';

/**
 * O que o técnico precisa de saber antes de cancelar um serviço que aceitou.
 *
 * A regra vive no servidor (Vendor::CANCELAMENTOS_ANTES_DA_PAUSA). Aqui só se
 * decide o que DIZER: que número de cancelamento este seria, e se é o que o
 * deixa sem convites. Pura de propósito, para se poder testar sem ecrã.
 *
 * Sem resumo do servidor (versão antiga do backend) devolve null, e o ecrã não
 * inventa números.
 */
export type AvisoDeCancelamento = {
  /** O número que ESTE cancelamento passaria a ser no mês (1.º, 2.º, ...). */
  numero: number;
  limite: number;
  horas: number;
  /** Este cancelamento é o que dá a pausa. */
  daPausa: boolean;
  /** Já está em pausa: cancelar prolonga-a. */
  jaEmPausa: boolean;
};

export const avisoDeCancelamento = (r?: ReliabilitySummary | null): AvisoDeCancelamento | null => {
  if (!r || typeof r.cancellations_this_month !== 'number' || !r.cancellations_limit) return null;

  const numero = r.cancellations_this_month + 1;

  return {
    numero,
    limite: r.cancellations_limit,
    horas: r.pause_hours,
    daPausa: numero >= r.cancellations_limit,
    jaEmPausa: !!r.invites_paused_until && new Date(r.invites_paused_until).getTime() > Date.now(),
  };
};

/** Até quando está sem convites, ou null. */
export const pausaAte = (r?: ReliabilitySummary | null): Date | null => {
  if (!r?.invites_paused_until) return null;
  const ate = new Date(r.invites_paused_until);
  return Number.isNaN(ate.getTime()) || ate.getTime() <= Date.now() ? null : ate;
};
