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
    // De 30 em 30 segundos: o rotulo so muda ao minuto, e um intervalo de 1s
    // acordava a app 60 vezes por minuto para escrever o mesmo texto.
    const id = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!iso) return null;

  const desde = new Date(iso).getTime();
  if (isNaN(desde)) return null;

  const minutos = Math.max(0, Math.floor((agora - desde) / 60_000));

  return { label: String(minutos), minutes: minutos };
};

export default useElapsedSince;
