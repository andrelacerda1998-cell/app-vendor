import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { applyTheme, ThemeName } from '@/constants/Colors';

/**
 * Tema claro/escuro da app.
 *
 * Três modos e não dois: "sistema" é o que a maioria das pessoas espera hoje
 * (o telemóvel escurece à noite e a app acompanha), mas quem trabalha em casas
 * mal iluminadas quer o escuro sempre, e quem anda na rua ao sol quer o claro
 * sempre — por isso a escolha explícita também existe.
 *
 * COMO A TROCA CHEGA AOS ECRÃS: `applyTheme` reescreve o objeto `Colors` que
 * os ecrãs já importam, e o `key` no provider volta a montar a árvore. Assim a
 * mudança apanha os 600+ sítios que leem `Colors.x` sem ter de passar cores por
 * props. É por isso que `Colors` é mutável — ver constants/Colors.ts.
 */

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme-mode';

interface ThemeContextProps {
  /** O que o técnico escolheu. */
  mode: ThemeMode;
  /** O tema que está mesmo a ser mostrado (com 'system' já resolvido). */
  theme: ThemeName;
  setMode: (mode: ThemeMode) => void;
  /**
   * Força o escuro enquanto durar um fluxo, independentemente da escolha —
   * usado pela autenticação, cujo ecrã é desenhado sobre preto (logo, fundo e
   * ilustrações) e não tem versão clara.
   */
  setForceDark: (active: boolean) => void;
  /**
   * Muda a cada troca de tema. Serve de `key` à árvore de ECRÃS — e só a ela:
   * remontar também os providers (sessão, serviço aberto, sockets) para trocar
   * uma cor seria pagar caro por uma mudança visual.
   */
  themeKey: string;
}

const ThemeContext = createContext<ThemeContextProps>({
  mode: 'system',
  theme: 'dark',
  setMode: () => {},
  setForceDark: () => {},
  themeKey: 'dark',
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  /**
   * Enquanto a escolha guardada não chega do disco, mostramos o escuro (o tema
   * de sempre) sem a marcar como decisão: sem isto, quem escolheu claro via a
   * app piscar escuro→claro a cada arranque.
   */
  const [loaded, setLoaded] = useState(false);
  /** Ver `setForceDark`. */
  const [forceDark, setForceDark] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (cancelled) return;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      })
      .catch(() => {
        // Sem preferência guardada seguimos o sistema, que é o valor inicial.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const theme: ThemeName = useMemo(() => {
    if (forceDark) return 'dark';
    if (mode === 'light' || mode === 'dark') return mode;
    // `useColorScheme` devolve null enquanto o sistema não responde; nesse
    // intervalo fica o escuro, que é o tema histórico da app.
    return systemScheme === 'light' ? 'light' : 'dark';
  }, [mode, systemScheme, forceDark]);

  // Antes de pintar: aplicar na renderização (e não num efeito) evita um
  // fotograma com as cores do tema anterior.
  applyTheme(theme);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Falhar a guardar não pode impedir a troca: o técnico vê a mudança
      // agora e, no pior caso, volta a escolhê-la no próximo arranque.
    });
  }, []);

  const value = useMemo(
    () => ({ mode, theme, setMode, setForceDark, themeKey: `${theme}-${loaded}` }),
    [mode, theme, setMode, loaded],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Liga (ou desliga) o escuro forçado enquanto o ecrã estiver montado.
 *
 * O par ligar/desligar é explícito e feito nos DOIS lados — o fluxo de
 * autenticação liga, a app desliga — em vez de confiar só na limpeza do
 * efeito: com navegação por deep link o grupo de autenticação pode continuar
 * montado, e a app ficava presa no escuro depois de entrar.
 */
export const useForceDarkTheme = (active = true) => {
  const { setForceDark } = useTheme();
  useEffect(() => {
    setForceDark(active);
  }, [setForceDark, active]);
};

/** Mantém a barra de estado do sistema legível sobre o tema escolhido. */
export const useSyncSystemAppearance = () => {
  const { theme } = useTheme();
  useEffect(() => {
    Appearance.setColorScheme?.(theme);
  }, [theme]);
};

export default ThemeContext;
