import { estadoAoFalharLocalizacao } from '../estadoSemLocalizacao';

describe('estadoAoFalharLocalizacao', () => {
  it('tira quem está Online', () => {
    expect(estadoAoFalharLocalizacao('Online')).toBe('Offline');
  });

  it('nunca põe Online quem está Offline', () => {
    expect(estadoAoFalharLocalizacao('Offline')).toBeNull();
  });

  it('não mexe antes de o estado chegar do servidor', () => {
    expect(estadoAoFalharLocalizacao(undefined)).toBeNull();
    expect(estadoAoFalharLocalizacao(null)).toBeNull();
  });
});
