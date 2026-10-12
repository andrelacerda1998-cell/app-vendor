/**
 * Quando é que o ecrã de um pedido a chegar se pode fechar sozinho.
 *
 * O caso que importa é o da notificação com a app em segundo plano: o ecrã abre
 * com a lista de pendentes da última visita, que ainda não tem o pedido novo, e
 * não está a carregar. Antes o ecrã fechava-se aí mesmo, antes de a lista nova
 * chegar, e o técnico perdia o pedido de 60 segundos.
 */
import { renderHook, act } from '@testing-library/react-native';
import useCloseWhenRequestGone from '@/hooks/useCloseWhenRequestGone';

type Props = { found: boolean; loading: boolean };

/** Uma recarga que só acaba (ou falha) quando o teste quiser. */
function recargaControlada() {
  let acabar: () => void = () => {};
  let falhar: (e: Error) => void = () => {};
  const refresh = jest.fn(
    () => new Promise<void>((resolve, reject) => {
      acabar = resolve;
      falhar = reject;
    }),
  );
  return { refresh, acabar: () => acabar(), falhar: (e: Error) => falhar(e) };
}

function montar(initialProps: Props, refresh: () => Promise<unknown>) {
  const close = jest.fn();
  const hook = renderHook(
    ({ found, loading }: Props) => useCloseWhenRequestGone({ found, loading, refresh, close }),
    { initialProps },
  );
  return { close, ...hook };
}

describe('useCloseWhenRequestGone', () => {
  it('app em segundo plano: não fecha com a lista antiga, espera pela nova e fica aberto', async () => {
    const { refresh, acabar } = recargaControlada();
    // Lista já carregada noutra visita (loading a false) e sem o pedido novo.
    const { close, rerender } = montar({ found: false, loading: false }, refresh);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();

    // O contexto põe o loading a true no render seguinte.
    rerender({ found: false, loading: true });
    expect(close).not.toHaveBeenCalled();

    // A lista nova chega com o pedido.
    rerender({ found: true, loading: false });
    await act(async () => acabar());

    expect(close).not.toHaveBeenCalled();
  });

  it('fecha quando a lista nova chega sem o pedido (expirou ou foi tratado noutro sítio)', async () => {
    const { refresh, acabar } = recargaControlada();
    const { close, rerender } = montar({ found: false, loading: false }, refresh);

    rerender({ found: false, loading: true });
    rerender({ found: false, loading: false });
    // A lista já não está a carregar, mas a recarga deste ecrã ainda não acabou.
    expect(close).not.toHaveBeenCalled();

    await act(async () => acabar());

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('fecha quando a recarga falha e o pedido continua sem aparecer', async () => {
    const { refresh, falhar } = recargaControlada();
    const { close } = montar({ found: false, loading: false }, refresh);

    await act(async () => falhar(new Error('sem rede')));

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('fecha quando o pedido estava na lista e desaparece', () => {
    const refresh = jest.fn(() => Promise.resolve());
    const { close, rerender } = montar({ found: true, loading: false }, refresh);

    expect(refresh).not.toHaveBeenCalled();

    // Outra recarga em curso: ainda não decide.
    rerender({ found: false, loading: true });
    expect(close).not.toHaveBeenCalled();

    rerender({ found: false, loading: false });
    expect(close).toHaveBeenCalledTimes(1);
    // A lista já era fresca (o pedido esteve lá): não há nada a recarregar.
    expect(refresh).not.toHaveBeenCalled();
  });

  it('app fria (lista ainda a carregar): espera e mostra o pedido quando chega', async () => {
    const { refresh, acabar } = recargaControlada();
    const { close, rerender } = montar({ found: false, loading: true }, refresh);

    expect(close).not.toHaveBeenCalled();

    rerender({ found: true, loading: false });
    await act(async () => acabar());

    expect(close).not.toHaveBeenCalled();
  });

  it('pede a lista uma só vez e fecha uma só vez', async () => {
    const { refresh, acabar } = recargaControlada();
    const { close, rerender } = montar({ found: false, loading: false }, refresh);

    await act(async () => acabar());
    rerender({ found: false, loading: true });
    rerender({ found: false, loading: false });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
