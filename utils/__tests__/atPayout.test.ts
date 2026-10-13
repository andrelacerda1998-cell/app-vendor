import {
  dinheiroRetido,
  faltaFaturacaoNoPerfil,
  jaExecutouServicos,
  pedeAtNoPerfil,
  pedeFaturacaoNoPerfil,
} from '../atPayout';

describe('pedeFaturacaoNoPerfil', () => {
  // A razão da mudança de 13/10: um técnico novo trabalha só com os documentos.
  it('não pede o IBAN nem a morada a quem ainda não precisa deles', () => {
    expect(pedeFaturacaoNoPerfil(false, false)).toBe(false);
    expect(pedeFaturacaoNoPerfil(false, undefined)).toBe(false);
  });

  it('pede depois do terceiro serviço', () => {
    expect(pedeFaturacaoNoPerfil(true, false)).toBe(true);
  });

  // Antes do terceiro não trava o trabalho, mas trava o pagamento: tem de saber.
  it('pede antes do terceiro a quem já tem dinheiro retido', () => {
    expect(pedeFaturacaoNoPerfil(false, true)).toBe(true);
  });

  // Servidor antigo: exige os dois desde o início, como sempre exigiu.
  it('pede quando o servidor não manda o campo', () => {
    expect(pedeFaturacaoNoPerfil(undefined, undefined)).toBe(true);
  });
});

describe('faltaFaturacaoNoPerfil', () => {
  it('não conta nada em falta a um técnico novo sem IBAN nem morada', () => {
    expect(faltaFaturacaoNoPerfil(null, null, false, false)).toBe(false);
  });

  it('conta em falta quando já se pede e falta um dos dois', () => {
    expect(faltaFaturacaoNoPerfil(null, 'Rua de Exemplo 1', true, false)).toBe(true);
    expect(faltaFaturacaoNoPerfil('PT50000000000000000000000', null, true, false)).toBe(true);
  });

  it('não conta nada com os dois dados', () => {
    expect(faltaFaturacaoNoPerfil('PT50000000000000000000000', 'Rua de Exemplo 1', true, true)).toBe(false);
  });
});

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
