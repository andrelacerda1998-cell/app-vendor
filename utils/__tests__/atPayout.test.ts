import {
  dinheiroRetido,
  jaExecutouServicos,
  pedeAtNoPerfil,
  razaoDoDinheiroRetido,
  retencaoDependeDoTecnico,
} from '../atPayout';

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

describe('razaoDoDinheiroRetido', () => {
  it('com o pagamento travado, a razão é a do travão', () => {
    expect(
      razaoDoDinheiroRetido({ payout_blocked: true, payout_blocker: 'iban_missing', payout_hold_reason: 'iban_missing' }),
    ).toBe('iban_missing');
  });

  // Desde 13/10/2026: o resto do saldo paga-se, por isso `payout_blocked` é
  // false — e mesmo assim há uma parte à espera, com uma razão.
  it('mostra a parte que espera pela fatura mesmo sem o pagamento travado', () => {
    expect(
      razaoDoDinheiroRetido({ payout_blocked: false, payout_blocker: null, payout_hold_reason: 'at_user_missing' }),
    ).toBe('at_user_missing');
  });

  it('não diz nada quando não há nada à espera', () => {
    expect(razaoDoDinheiroRetido({ payout_blocked: false, payout_blocker: null, payout_hold_reason: null })).toBeNull();
    expect(razaoDoDinheiroRetido(null)).toBeNull();
  });

  // Servidor anterior a 13/10/2026: sem `payout_hold_reason`, como antes.
  it('num servidor antigo só fala com o pagamento travado', () => {
    expect(razaoDoDinheiroRetido({ payout_blocked: true, payout_blocker: 'fiscal_address_missing' })).toBe(
      'fiscal_address_missing',
    );
    expect(razaoDoDinheiroRetido({ payout_blocked: true })).toBe('at_user_missing');
    expect(razaoDoDinheiroRetido({ payout_blocked: false })).toBeNull();
  });
});

describe('retencaoDependeDoTecnico', () => {
  it('o IBAN, a morada e a AT são com ele', () => {
    expect(retencaoDependeDoTecnico('iban_missing')).toBe(true);
    expect(retencaoDependeDoTecnico('fiscal_address_missing')).toBe(true);
    expect(retencaoDependeDoTecnico('at_user_missing')).toBe(true);
  });

  it('a fatura por emitir é com a Piquet', () => {
    expect(retencaoDependeDoTecnico('invoice_pending')).toBe(false);
  });

  it('sem razão, não há nada a fazer', () => {
    expect(retencaoDependeDoTecnico(null)).toBe(false);
  });
});
