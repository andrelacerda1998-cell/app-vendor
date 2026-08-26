import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import useEcho from '@/hooks/echo';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { MatchingInvitation } from '@/types/matching';

/**
 * Convites de seleção abertos, com atualização ao vivo.
 *
 * Os três eventos do backend existem para o mesmo fim: **nunca silêncio**. Um
 * profissional que diz que sim e fica sem resposta aprende a não responder mais.
 * Por isso o convite desaparece da lista assim que o pedido fecha ou ele perde,
 * em vez de ficar lá a apodrecer até ele tocar e levar um erro.
 */
export function useMatchingInvitations() {
  const { api } = useApi();
  const { vendorData } = useSession();
  const echo = useEcho();

  const [invitations, setInvitations] = useState<MatchingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  /**
   * Horas em que costumam entrar mais pedidos, calculadas pelo servidor a
   * partir de pedidos reais. Fica null quando não há amostra que chegue — e
   * nesse caso não se mostra nada, em vez de inventar um padrão.
   */
  const [busiestHours, setBusiestHours] = useState<{ from: number; to: number; share: number } | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get(API_ROUTES.VENDOR_MATCHING_INVITATIONS);
      if (!mountedRef.current) return;
      setInvitations(Array.isArray(data?.data) ? data.data : []);
      setFailed(false);
    } catch {
      if (!mountedRef.current) return;
      setFailed(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    let cancelled = false;

    api.get(API_ROUTES.VENDOR_MATCHING_INSIGHTS)
      .then(({ data }) => {
        if (cancelled) return;
        setBusiestHours(data?.data?.busiest_hours ?? null);
      })
      .catch(() => {
        // Informação acessória: se falhar, o ecrã funciona na mesma sem ela.
      });

    return () => { cancelled = true; };
  }, [api]);

  const remove = useCallback((candidateId?: number) => {
    if (!candidateId) return;
    setInvitations((list) => list.filter((i) => i.candidate_id !== candidateId));
  }, []);

  // Eventos em tempo real. O canal é o mesmo dos pedidos (service.vendor.{userId}).
  useEffect(() => {
    const userId = vendorData?.user_id ?? vendorData?.user?.id;
    if (!echo || !userId) return;

    const channel = echo.private(`service.vendor.${userId}`);
    if (!channel) return;

    const onInvite = () => fetch();
    const onClosed = (data: any) => remove(data?.candidate_id);
    const onLost = (data: any) => remove(data?.candidate_id);

    channel.listen('.MatchingInvitationEvent', onInvite);
    channel.listen('.MatchingRequestClosedEvent', onClosed);
    channel.listen('.MatchingCandidateLostEvent', onLost);

    return () => {
      channel.stopListening('.MatchingInvitationEvent', onInvite);
      channel.stopListening('.MatchingRequestClosedEvent', onClosed);
      channel.stopListening('.MatchingCandidateLostEvent', onLost);
    };
  }, [echo, vendorData, fetch, remove]);

  const accept = useCallback(async (candidateId: number) => {
    if (submitting) return { ok: false as const, message: null };
    setSubmitting(candidateId);

    try {
      await api.post(API_ROUTES.VENDOR_MATCHING_ACCEPT(candidateId));
      await fetch();
      return { ok: true as const, message: null };
    } catch (error: any) {
      // O backend distingue "a janela fechou" de "outro foi mais rápido".
      // Passamos a mensagem tal e qual: um erro vago faz parecer que a app
      // está partida, quando na verdade ele só chegou tarde.
      remove(candidateId);
      return { ok: false as const, message: error?.response?.data?.message ?? null };
    } finally {
      if (mountedRef.current) setSubmitting(null);
    }
  }, [api, fetch, remove, submitting]);

  const decline = useCallback(async (candidateId: number) => {
    if (submitting) return;
    setSubmitting(candidateId);
    remove(candidateId);

    try {
      await api.post(API_ROUTES.VENDOR_MATCHING_DECLINE(candidateId));
    } catch {
      // Recusar é a ação sem consequência: se falhar, o convite acaba por
      // expirar sozinho. Não vale a pena incomodar o técnico com isto.
      fetch();
    } finally {
      if (mountedRef.current) setSubmitting(null);
    }
  }, [api, fetch, remove, submitting]);

  return { invitations, loading, failed, submitting, busiestHours, refresh: fetch, accept, decline };
}

export default useMatchingInvitations;
