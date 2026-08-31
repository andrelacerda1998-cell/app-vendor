/**
 * Convite de seleção de profissional — ver docs/matching.md no backend.
 *
 * Um convite NÃO é uma adjudicação. Aceitar significa "estou disponível e
 * interessado"; o cliente escolhe depois, de entre quem aceitou. É uma
 * diferença que a interface tem de deixar clara, senão o técnico assume que
 * aceitar é ficar com o trabalho e sente-se enganado quando perde.
 */
export interface MatchingInvitation {
  candidate_id: number;
  /** Quantos aceites chegam ao cliente (matching.shortlist_size no backend). */
  shortlist_size?: number;
  service_id: number;
  status: string;
  /** O que ELE recebe. O que o cliente paga nunca aparece aqui. */
  amount_for_vendor: number | null;
  distance: number | null;
  /** Quando a janela abriu. Com o expires_at dá a proporção já decorrida. */
  notified_at: string | null;
  /** Quando a janela fecha. Visível de propósito — ver o card. */
  expires_at: string | null;
  service_type: {
    id: number;
    name: string;
    time?: number | null;
  } | null;
  address: {
    city: string | null;
    postal_code: string | null;
  } | null;
  /**
   * Dia e hora pretendidos. Vem de `pending_schedule_data` enquanto a agenda
   * não pode existir (ver docs/matching.md no backend).
   */
  schedule: {
    scheduled_day: string | null;
    scheduled_time_start: string | null;
  } | null;
}
