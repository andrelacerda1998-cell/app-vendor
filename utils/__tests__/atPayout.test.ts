import { diasAteAoPrazoDaAt, dinheiroRetido, jaExecutouServicos, pedeAtNoPerfil } from '../atPayout';

describe('dinheiroRetido', () => {
  it('avisa quando o servidor afirma que está retido', () => {
    expect(dinheiroRetido(true)).toBe(true);
  });

  it('não avisa quando o servidor diz que não está', () => {
    expect(dinheiroRetido(false)).toBe(false);
  });

  // O caso que justifica o `=== true`: servidor antigo, campo ausente. Nada está
  // retido, e dizer ao técnico que o dinheiro dele está preso seria mentira.
  it('não avisa quando o servidor não manda o campo', () => {
    expect(dinheiroRetido(undefined)).toBe(false);
  });
});

describe('pedeAtNoPerfil', () => {
  it('não pede a AT a quem ainda não precisa dela', () => {
    expect(pedeAtNoPerfil(null, false)).toBe(false);
  });

  it('pede a AT depois de ela ser exigida', () => {
    expect(pedeAtNoPerfil(null, true)).toBe(true);
  });

  // O caso que justifica o `!== false`: sem resposta, pede — como antes de a
  // regra existir. O erro seguro aqui é pedir a mais.
  it('pede a AT quando o servidor não manda o campo', () => {
    expect(pedeAtNoPerfil(null, undefined)).toBe(true);
  });

  it('não pede nada a quem já a deu', () => {
    expect(pedeAtNoPerfil('123456789/1', true)).toBe(false);
    expect(pedeAtNoPerfil('123456789/1', undefined)).toBe(false);
  });

  it('trata string vazia como não dada', () => {
    expect(pedeAtNoPerfil('', true)).toBe(true);
  });
});

describe('jaExecutouServicos', () => {
  it('um técnico novo ainda não executou nada', () => {
    expect(jaExecutouServicos(false, 3)).toBe(false);
  });

  it('ao primeiro serviço concluído já executou', () => {
    expect(jaExecutouServicos(false, 2)).toBe(true);
  });

  it('com a AT já exigida executou de certeza', () => {
    expect(jaExecutouServicos(true, 0)).toBe(true);
  });

  // Servidor antigo: assume o texto de entrada, que é o que a app sempre disse.
  it('sem os campos assume que não executou', () => {
    expect(jaExecutouServicos(undefined, undefined)).toBe(false);
  });
});

describe("diasAteAoPrazoDaAt", () => {
  const AGORA = Date.parse("2026-09-30T12:00:00Z");
  const emDias = (d: number) => new Date(AGORA + d * 86_400_000).toISOString();

  it("conta os dias que faltam", () => {
    expect(diasAteAoPrazoDaAt(emDias(5), AGORA)).toBe(5);
    expect(diasAteAoPrazoDaAt(emDias(1), AGORA)).toBe(1);
  });

  // 18 horas são "falta 1 dia", não "faltam 0": dizer zero a quem ainda tem
  // tempo é dizer-lhe que já perdeu.
  it("arredonda para cima as horas que sobram", () => {
    expect(diasAteAoPrazoDaAt(emDias(0.75), AGORA)).toBe(1);
  });

  it("nunca é negativo depois de o prazo passar", () => {
    expect(diasAteAoPrazoDaAt(emDias(-3), AGORA)).toBe(0);
  });

  it("sem prazo não há contagem", () => {
    expect(diasAteAoPrazoDaAt(null, AGORA)).toBeNull();
    expect(diasAteAoPrazoDaAt(undefined, AGORA)).toBeNull();
  });

  it("uma data inválida não rebenta nem inventa um número", () => {
    expect(diasAteAoPrazoDaAt("nem-data-e", AGORA)).toBeNull();
  });
});
