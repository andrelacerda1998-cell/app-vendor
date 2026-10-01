import { useCallback, useEffect, useState } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import useEcho from '@/hooks/echo';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { MatchingInvitation } from '@/types/matching';

/**
 * Candidaturas aceites à espera de o cliente decidir.
 *
 * Entre dizer "tenho disponibilidade" e o cliente escolher, a app não mostrava
 * nada: a Home ficava igual e a Agenda dizia "livre" -- inclusive no dia do
 * serviço. Ele não tinha onde confirmar que se tinha candidatado, nem a quê.
 *
 * Atualiza-se sozinho pelos MESMOS eventos que o `useMatchingInvitations`
 * escuta, porque são os mesmos desfechos vistos do outro lado: quando o
 * pedido fecha ou ele perde, a candidatura tem de sair daqui -- senão fica a
 * guardar uma tarde para um trabalho que já é de outro.
 */
export function useMatchingAwaiting() {
  const { api } = useApi();
  const { vendorData } = useSession();
  const echo = useEcho();

  const [awaiting, setAwaiting] = useState<MatchingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  /**
   * Relógio próprio, só para deixar cair as candidaturas cujo prazo acabou.
   *
   * O servidor já não as devolve, mas entre duas leituras pode passar o
   * instante em que o prazo fecha -- e o cartão ficava no ecrã a dizer "à
   * espera da decisão" quando já não há decisão nenhuma. Ao minuto chega: a
   * precisão ao segundo é do contador, não desta lista.
   */
  const [agora, setAgora] = useState(() => Date.now());

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get(API_ROUTES.VENDOR_MATCHING_AWAITING);
      setAwaiting(Array.isArray(data?.data) ? data.data : []);
    } catch {
      // Sem rede, fica como estava: um ecrã a dizer "não estás à espera de
      // nada" por causa de uma falha de rede é pior do que não dizer nada.
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void fetch(); }, [fetch]);

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 30_000);

    return () => clearInterval(id);
  }, []);

  /**
   * Fora as que já expiraram. O servidor filtra-as (é ele quem manda), mas a
   * app volta a aplicar a mesma regra sobre o que tem em mãos: sem isto o
   * cartão só desaparecia na leitura seguinte.
   */
  const vivas = awaiting.filter((c) => {
    const fim = c.customer_deadline ? Date.parse(c.customer_deadline) : NaN;

    return Number.isNaN(fim) || fim > agora;
  });

  useEffect(() => {
    // O MESMO canal do `useMatchingInvitations` (service.vendor.{userId}).
    const userId = vendorData?.user_id ?? vendorData?.user?.id;
    if (!echo || !userId) return;

    const canal = echo.private(`service.vendor.${userId}`);
    if (!canal) return;

    const recarregar = () => { void fetch(); };

    canal.listen('.MatchingInvitationEvent', recarregar);
    canal.listen('.MatchingRequestClosedEvent', recarregar);
    canal.listen('.MatchingCandidateLostEvent', recarregar);

    return () => {
      canal.stopListening('.MatchingInvitationEvent', recarregar);
      canal.stopListening('.MatchingRequestClosedEvent', recarregar);
      canal.stopListening('.MatchingCandidateLostEvent', recarregar);
    };
  }, [echo, vendorData?.user_id, vendorData?.user?.id, fetch]);

  return { awaiting: vivas, loading, refresh: fetch };
}

export default useMatchingAwaiting;
