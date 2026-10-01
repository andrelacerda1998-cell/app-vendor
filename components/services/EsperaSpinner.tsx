import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

import { Colors } from '@/constants/Colors';

/**
 * Anel a rodar, para o que está à espera de uma decisão de outra pessoa.
 *
 * É um CÍRCULO desenhado, não um glifo. O `loader` do Feather, que estava aqui
 * antes, desenha raios a sair de um ponto -- a rodar parecia um sol a tremer, e
 * não a coisa universal que toda a gente lê como "está a carregar". Um `View`
 * redondo com a borda quase toda apagada e um arco aceso é o mesmo que a web
 * faz há vinte anos, e lê-se sem pensar.
 *
 * Um ícone parado lê-se como um estado; isto é um PROCESSO a decorrer do outro
 * lado. A rotação diz "está a acontecer, não és tu que tens de fazer alguma
 * coisa" sem precisar de o escrever.
 *
 * `useNativeDriver` porque a animação corre para sempre enquanto o cartão
 * estiver no ecrã: na thread de JS competiria com o scroll e com os contadores
 * de segundo a segundo.
 */
const EsperaSpinner = ({
  size = 20,
  color = Colors.muted,
  /** Espessura do anel. Por omissão, proporcional ao tamanho. */
  thickness,
}: {
  size?: number;
  color?: string;
  thickness?: number;
}) => {
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animacao.start();

    // Parar ao desmontar: um `Animated.loop` esquecido continua a correr
    // depois de o cartão sair do ecrã.
    return () => animacao.stop();
  }, [giro]);

  const rotate = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const borda = thickness ?? Math.max(2, Math.round(size / 8));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: borda,
        // O anel quase todo apagado; só o topo aceso. É o arco aceso que dá a
        // sensação de rotação -- um círculo inteiro da mesma cor, a rodar, fica
        // parado aos olhos.
        borderColor: `${color}26`,
        borderTopColor: color,
        transform: [{ rotate }],
      }}
    />
  );
};

export default EsperaSpinner;
