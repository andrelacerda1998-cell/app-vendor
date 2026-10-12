import { useEffect, useRef, useState } from 'react';

type Options = {
  /** O pedido está na lista de pendentes que o contexto tem em memória. */
  found: boolean;
  /** A lista de pendentes está a ser (re)carregada. */
  loading: boolean;
  /** Recarrega a lista de pendentes. A promessa resolve quando a ida ao servidor acaba. */
  refresh: () => Promise<unknown>;
  /** Fecha o ecrã. */
  close: () => void;
};

/**
 * Fecha o ecrã de um pedido a chegar quando o pedido já não está entre os
 * pendentes (expirou, foi aceite/recusado noutro sítio ou o cliente cancelou).
 *
 * Só se pode concluir isso com uma lista carregada DEPOIS de o ecrã abrir. A
 * notificação abre o ecrã com a lista que está em memória e, com a app em
 * segundo plano, essa lista é da última visita: o pedido novo ainda não está
 * lá. Antes, o ecrã via "não está e não está a carregar" logo no primeiro
 * render — o `getPendingServices()` acabado de chamar só põe o loading a true
 * no render seguinte — e fechava-se. O técnico perdia o ecrã dos 60 segundos.
 *
 * Fecha quando:
 *  - a recarga pedida por este ecrã acabou e o pedido não veio;
 *  - o pedido esteve na lista e desapareceu numa recarga posterior.
 */
export default function useCloseWhenRequestGone({ found, loading, refresh, close }: Options) {
  const [refreshed, setRefreshed] = useState(false);
  const requestedRef = useRef(false);
  const seenRef = useRef(false);
  const closedRef = useRef(false);

  // Pedido nunca visto na lista: pede uma lista nova, uma só vez. Se já foi
  // visto, a lista não estava desatualizada e não há nada a recarregar.
  useEffect(() => {
    if (found) {
      seenRef.current = true;
      return;
    }
    if (seenRef.current || requestedRef.current) return;
    requestedRef.current = true;
    refresh()
      .catch(() => undefined)
      .then(() => setRefreshed(true));
  }, [found, refresh]);

  useEffect(() => {
    if (found || loading || closedRef.current) return;
    if (refreshed || seenRef.current) {
      closedRef.current = true;
      close();
    }
  }, [found, loading, refreshed, close]);
}
