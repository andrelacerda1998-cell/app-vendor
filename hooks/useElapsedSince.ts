import { useEffect, useState } from 'react';

/**
 * Ha quanto tempo isto aconteceu — contagem a subir.
 *
 * Substitui a contagem decrescente nos convites de selecao. Uma contagem
 * decrescente promete uma coisa que este ecra nao pode cumprir: que responder
 * a tempo da o trabalho. Nao da — quem escolhe e o cliente, e o convite pode
 * fechar antes do fim da janela se tres profissionais responderem primeiro.
 *
 * O que ajuda mesmo a decidir e o oposto: ha quanto tempo o pedido foi feito.
 * "Ha 2 minutos" diz que ainda vale a pena; "ha 18 minutos" diz que ja ha
 * provavelmente gente a frente. E nao cria pressa artificial.
 */
export const useElapsedSince = (iso?: string | null): { label: string; minutes: number } | null => {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    // Ao segundo: o contador esta a vista e em destaque, e um numero de
    // segundos parado le-se como ecra congelado.
    const id = setInterval(() => setAgora(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  if (!iso) return null;

  const desde = new Date(iso).getTime();
  if (isNaN(desde)) return null;

  const total = Math.max(0, Math.floor((agora - desde) / 1_000));
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;

  // "4:07" — o formato de um cronometro, que se le sem instrucoes.
  return {
    label: `${minutos}:${String(segundos).padStart(2, '0')}`,
    minutes: minutos,
  };
};

export default useElapsedSince;
