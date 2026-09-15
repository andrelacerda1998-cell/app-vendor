import { useEffect, useState } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';

export interface VendorStats {
  this_week_earnings: number;
  this_week_services: number;
  total_services: number;
  rating: number | null;
  total_earned?: number;
  pending_payment_amount?: number;
  pending_payment_count?: number;
  next_payment_date?: string;
}

/**
 * Números do técnico (VENDOR_GET_STATS), partilhados por quem os mostra.
 *
 * Dois cartões da Home precisam da mesma resposta — os totais da semana e o
 * próximo pagamento. Cada um a pedir por sua conta seria a mesma chamada duas
 * vezes por abertura da app, e com a hipótese de mostrarem números diferentes
 * se uma falhasse. A promessa em voo é partilhada durante alguns segundos:
 * quem chegar a seguir apanha a mesma.
 */
const TTL_MS = 15_000;
let cache: { at: number; promise: Promise<VendorStats | null> } | null = null;

export const useVendorStats = () => {
  const { api } = useApi();
  const [stats, setStats] = useState<VendorStats | null>(null);

  useEffect(() => {
    let alive = true;

    if (!cache || Date.now() - cache.at > TTL_MS) {
      cache = {
        at: Date.now(),
        promise: api
          .get(API_ROUTES.VENDOR_GET_STATS)
          .then((res: any) => (res?.data?.data ?? null) as VendorStats | null)
          // Falhar não fica em cache: a próxima montagem volta a tentar.
          .catch(() => { cache = null; return null; }),
      };
    }

    cache.promise.then((data) => { if (alive) setStats(data); });

    return () => { alive = false; };
  }, [api]);

  return stats;
};

export default useVendorStats;
