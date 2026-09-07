/**
 * Slider do valor/hora, em JS puro (sem dependencia nativa).
 *
 * Existia duplicado no registo e no ecra do Perfil, e ambas as copias tinham
 * o mesmo bug: liam `e.nativeEvent.locationX`. O `locationX` e relativo ao
 * ELEMENTO QUE RECEBE O TOQUE, e assim que o thumb alcanca o dedo passa a ser
 * ele o alvo -- a leitura cai de "0 a largura da barra" para "0 a 26" e o
 * valor colapsa para o minimo. Era exatamente isto que fazia o slider fugir
 * ao dedo e obrigar a varias tentativas.
 *
 * Aqui usamos a coordenada absoluta do gesto (`gestureState.moveX`) menos a
 * posicao da barra no ecra, medida no arranque. Isso e imune a qual filho
 * esta debaixo do dedo.
 */
import React, { useRef, useState } from 'react';
import { View, PanResponder, type LayoutChangeEvent } from 'react-native';

import { Colors } from '@/constants/Colors';

const THUMB = 26;
/** Area de toque minima recomendada; a barra em si tem 6pt de altura. */
const TOUCH_HEIGHT = 44;

const RateSlider = ({
  value,
  onChange,
  min,
  max,
  accessibilityLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  accessibilityLabel?: string;
}) => {
  const trackRef = useRef<View>(null);
  const widthRef = useRef(0);
  const pageXRef = useRef(0);
  const [, force] = useState(0);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  /**
   * `x` e a distancia ao inicio da barra. O thumb desliza entre 0 e
   * (largura - THUMB), pelo que o CENTRO dele vai de THUMB/2 a largura-THUMB/2:
   * descontar THUMB/2 e mapear sobre esse curso e o que faz o centro do thumb
   * ficar exatamente debaixo do dedo, em vez de ir ficando para tras.
   */
  const xToValue = (x: number) => {
    const travel = Math.max(1, widthRef.current - THUMB);
    const ratio = (x - THUMB / 2) / travel;
    return clamp(Math.round(min + ratio * (max - min)));
  };

  const measure = () => {
    trackRef.current?.measureInWindow((pageX, _y, width) => {
      pageXRef.current = pageX;
      if (width) widthRef.current = width;
      force((n) => n + 1);
    });
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Uma vez agarrado, nao larga para o scroll da pagina — sem isto, um
      // arrasto ligeiramente na diagonal era roubado pelo ScrollView.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_e, g) => onChange(xToValue(g.x0 - pageXRef.current)),
      onPanResponderMove: (_e, g) => onChange(xToValue(g.moveX - pageXRef.current)),
    })
  ).current;

  const onLayout = (ev: LayoutChangeEvent) => {
    widthRef.current = ev.nativeEvent.layout.width;
    measure();
  };

  const pct = (clamp(value) - min) / (max - min);
  const thumbLeft = pct * Math.max(0, widthRef.current - THUMB);

  return (
    <View
      ref={trackRef}
      onLayout={onLayout}
      style={{ height: TOUCH_HEIGHT, justifyContent: 'center' }}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: clamp(value) }}
      {...pan.panHandlers}
    >
      {/* trilho */}
      <View className="h-1.5 rounded-full" style={{ backgroundColor: Colors.card_high }} />
      {/* preenchimento */}
      <View
        className="h-1.5 rounded-full absolute"
        style={{
          backgroundColor: Colors.support_primary,
          width: Math.max(THUMB / 2, thumbLeft + THUMB / 2),
        }}
      />
      {/* thumb */}
      <View
        className="absolute rounded-full"
        style={{
          width: THUMB,
          height: THUMB,
          left: thumbLeft,
          backgroundColor: Colors.support_primary,
          borderWidth: 3,
          borderColor: Colors.bg,
        }}
      />
    </View>
  );
};

export default RateSlider;
