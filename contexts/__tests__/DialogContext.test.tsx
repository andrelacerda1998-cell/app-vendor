/**
 * Fila de diálogos: um aberto termina o ciclo antes de o seguinte aparecer,
 * e diálogos idênticos consecutivos não se acumulam.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { DialogProvider, useDialog } from '@/contexts/DialogContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DialogProvider>{children}</DialogProvider>
);

describe('DialogContext (fila)', () => {
  it('mostra o primeiro e guarda o segundo para depois do fecho', () => {
    const { result } = renderHook(() => useDialog(), { wrapper });

    act(() => result.current.openDialog({ title: 'A', subtitle: 'a' }));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.content?.title).toBe('A');

    act(() => result.current.openDialog({ title: 'B', subtitle: 'b' }));
    // O aberto não é substituído…
    expect(result.current.content?.title).toBe('A');

    act(() => result.current.closeDialog());
    // …e o seguinte aparece ao fechar.
    expect(result.current.isOpen).toBe(true);
    expect(result.current.content?.title).toBe('B');

    act(() => result.current.closeDialog());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.content).toBeNull();
  });

  it('não acumula diálogos idênticos consecutivos', () => {
    const { result } = renderHook(() => useDialog(), { wrapper });

    act(() => result.current.openDialog({ title: 'Erro', subtitle: 'x' }));
    act(() => result.current.openDialog({ title: 'Erro', subtitle: 'x' }));
    act(() => result.current.openDialog({ title: 'Erro', subtitle: 'x' }));

    act(() => result.current.closeDialog());
    // Os duplicados foram descartados: fechar o único mostrado esvazia tudo.
    expect(result.current.isOpen).toBe(false);
  });

  it('chama onClose do diálogo que fecha, não do seguinte', () => {
    const { result } = renderHook(() => useDialog(), { wrapper });
    const onCloseA = jest.fn();
    const onCloseB = jest.fn();

    act(() => result.current.openDialog({ title: 'A', onClose: onCloseA }));
    act(() => result.current.openDialog({ title: 'B', onClose: onCloseB }));

    act(() => result.current.closeDialog());
    expect(onCloseA).toHaveBeenCalledTimes(1);
    expect(onCloseB).not.toHaveBeenCalled();
  });
});
