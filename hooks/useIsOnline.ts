/**
 * Estado da ligação à internet, para os ecrãs distinguirem
 * "não tens dados" de "não deu para ir buscar os dados".
 *
 * Usa `@react-native-community/netinfo`, que já é dependência do projeto
 * (11.4.1) — não foi instalado nada de novo.
 *
 * Nota importante: `isInternetReachable` é `null` enquanto o NetInfo ainda não
 * decidiu. Nesse intervalo assumimos ONLINE de propósito — dar "estás offline"
 * a quem tem rede é pior do que deixar a chamada falhar e mostrar o erro real.
 */
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useIsOnline = (): boolean => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // `isInternetReachable === false` é a única prova de que não há internet:
      // `isConnected` sozinho dá true em Wi-Fi sem saída para a rede.
      const connected = state.isConnected !== false;
      const reachable = state.isInternetReachable !== false;
      setIsOnline(connected && reachable);
    });

    // Leitura inicial — o listener só dispara na primeira mudança em alguns Android.
    NetInfo.fetch()
      .then((state) => setIsOnline(state.isConnected !== false && state.isInternetReachable !== false))
      .catch(() => setIsOnline(true));

    return () => unsubscribe();
  }, []);

  return isOnline;
};

export default useIsOnline;
