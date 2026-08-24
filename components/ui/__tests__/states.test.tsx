import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState, ErrorState } from '@/components/ui';

/**
 * Smoke tests das primitivas de estado. Não testam pixels — testam o contrato:
 * o texto chega ao ecrã e o botão de retry chama o callback.
 */
describe('EmptyState', () => {
  it('mostra o título', () => {
    render(<EmptyState title="Sem pedidos" />);
    expect(screen.getByText('Sem pedidos')).toBeTruthy();
  });

  it('mostra o subtítulo quando existe', () => {
    render(<EmptyState title="Sem pedidos" subtitle="Assim que houver, aparece aqui." />);
    expect(screen.getByText('Assim que houver, aparece aqui.')).toBeTruthy();
  });

  it('omite o subtítulo quando não é passado', () => {
    render(<EmptyState title="Sem pedidos" />);
    expect(screen.queryByText('Assim que houver, aparece aqui.')).toBeNull();
  });
});

describe('ErrorState', () => {
  it('mostra título e subtítulo', () => {
    render(<ErrorState title="Sem ligação" subtitle="Verifica a internet." />);
    expect(screen.getByText('Sem ligação')).toBeTruthy();
    expect(screen.getByText('Verifica a internet.')).toBeTruthy();
  });

  it('não mostra botão sem `onRetry`', () => {
    render(<ErrorState title="Sem ligação" />);
    expect(screen.queryByText('general.try_again')).toBeNull();
  });

  it('mostra o botão com a label por omissão e chama `onRetry`', () => {
    const onRetry = jest.fn();
    render(<ErrorState title="Sem ligação" onRetry={onRetry} />);

    // O mock do i18n devolve a chave, por isso é a chave que aparece.
    fireEvent.press(screen.getByText('general.try_again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('respeita uma label de retry personalizada', () => {
    const onRetry = jest.fn();
    render(<ErrorState title="Erro" onRetry={onRetry} retryLabel="Tentar de novo" />);

    fireEvent.press(screen.getByText('Tentar de novo'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
