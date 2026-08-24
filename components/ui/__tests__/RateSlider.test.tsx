import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PanResponder } from 'react-native';

import RateSlider from '@/components/ui/RateSlider';

/**
 * O slider do valor/hora "fugia ao dedo": lia `e.nativeEvent.locationX`, que e
 * relativo ao elemento sob o toque. Assim que o thumb alcancava o dedo passava
 * a ser ele o alvo e a leitura caia de "0..largura" para "0..26", atirando o
 * valor para o minimo.
 *
 * Estes testes agarram os handlers reais que o componente regista no
 * PanResponder e disparam-nos com um nativeEvent ENVENENADO (locationX = 3,
 * como se o dedo estivesse sobre o thumb) mais um gestureState correto. Se
 * alguem voltar a usar locationX, o valor sai errado e o teste falha.
 */
const TRACK_PAGE_X = 20;
const TRACK_WIDTH = 226; // 226 - 26 (thumb) = 200pt de curso util

jest.mock('react-native/Libraries/Interaction/PanResponder', () => {
  const actual = jest.requireActual('react-native/Libraries/Interaction/PanResponder');
  return actual;
});

/** Captura a config passada ao PanResponder.create para poder invocar os handlers. */
const captureHandlers = () => {
  const spy = jest.spyOn(PanResponder, 'create');
  return () => spy.mock.calls[0][0] as any;
};

/** Finge a medicao do elemento: measureInWindow e onLayout. */
const stubLayout = () => {
  jest
    .spyOn(require('react-native').View.prototype as any, 'measureInWindow')
    .mockImplementation(function (cb: any) {
      cb(TRACK_PAGE_X, 0, TRACK_WIDTH, 44);
    });
};

describe('RateSlider', () => {
  afterEach(() => jest.restoreAllMocks());

  it('usa a coordenada absoluta do gesto, nao o locationX do elemento tocado', () => {
    const getConfig = captureHandlers();
    stubLayout();
    const onChange = jest.fn();

    const { UNSAFE_root } = render(
      <RateSlider value={8} onChange={onChange} min={8} max={50} />
    );
    // Dispara o onLayout para o componente registar largura e posicao.
    UNSAFE_root.findByProps({ accessibilityRole: 'adjustable' }).props.onLayout({
      nativeEvent: { layout: { width: TRACK_WIDTH, height: 44, x: 0, y: 0 } },
    });

    const config = getConfig();

    // Dedo a meio da barra: pageX = 20 + 13 + 100 = 133.
    // O nativeEvent traz locationX=3 de proposito (dedo sobre o thumb).
    config.onPanResponderMove(
      { nativeEvent: { locationX: 3 } },
      { moveX: TRACK_PAGE_X + 13 + 100, dx: 0, x0: 0 }
    );

    // Meio de [8, 50] = 29. Com o bug antigo daria ~8.
    expect(onChange).toHaveBeenCalledWith(29);
  });

  it('limita ao maximo quando o dedo passa do fim da barra', () => {
    const getConfig = captureHandlers();
    stubLayout();
    const onChange = jest.fn();

    const { UNSAFE_root } = render(
      <RateSlider value={20} onChange={onChange} min={8} max={50} />
    );
    UNSAFE_root.findByProps({ accessibilityRole: 'adjustable' }).props.onLayout({
      nativeEvent: { layout: { width: TRACK_WIDTH, height: 44, x: 0, y: 0 } },
    });

    getConfig().onPanResponderMove(
      { nativeEvent: { locationX: 3 } },
      { moveX: TRACK_PAGE_X + TRACK_WIDTH + 500, dx: 0, x0: 0 }
    );

    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('limita ao minimo quando o dedo passa do inicio da barra', () => {
    const getConfig = captureHandlers();
    stubLayout();
    const onChange = jest.fn();

    const { UNSAFE_root } = render(
      <RateSlider value={20} onChange={onChange} min={8} max={50} />
    );
    UNSAFE_root.findByProps({ accessibilityRole: 'adjustable' }).props.onLayout({
      nativeEvent: { layout: { width: TRACK_WIDTH, height: 44, x: 0, y: 0 } },
    });

    getConfig().onPanResponderMove(
      { nativeEvent: { locationX: 3 } },
      { moveX: TRACK_PAGE_X - 500, dx: 0, x0: 0 }
    );

    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('expoe o valor para leitores de ecra', () => {
    render(<RateSlider value={17} onChange={jest.fn()} min={8} max={50} accessibilityLabel="Valor por hora" />);
    const el = screen.getByLabelText('Valor por hora');
    expect(el.props.accessibilityValue).toEqual({ min: 8, max: 50, now: 17 });
  });
});
