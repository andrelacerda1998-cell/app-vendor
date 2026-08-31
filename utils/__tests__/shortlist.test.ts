import { DEFAULT_SHORTLIST_SIZE, resolveShortlistSize } from '../shortlist';

describe('resolveShortlistSize', () => {
  it('usa o valor que vem do backend', () => {
    expect(resolveShortlistSize([{ shortlist_size: 5 }])).toBe(5);
  });

  it('backend antigo (sem o campo) cai no valor por omissão', () => {
    expect(resolveShortlistSize([{}, {}])).toBe(DEFAULT_SHORTLIST_SIZE);
  });

  it('lista vazia ou ausente não rebenta', () => {
    expect(resolveShortlistSize([])).toBe(DEFAULT_SHORTLIST_SIZE);
    expect(resolveShortlistSize(null)).toBe(DEFAULT_SHORTLIST_SIZE);
    expect(resolveShortlistSize(undefined)).toBe(DEFAULT_SHORTLIST_SIZE);
  });

  it('ignora valores inválidos — nunca promete "0 primeiros"', () => {
    expect(resolveShortlistSize([{ shortlist_size: 0 }])).toBe(DEFAULT_SHORTLIST_SIZE);
    expect(resolveShortlistSize([{ shortlist_size: -2 }])).toBe(DEFAULT_SHORTLIST_SIZE);
    expect(resolveShortlistSize([{ shortlist_size: NaN }])).toBe(DEFAULT_SHORTLIST_SIZE);
  });

  it('usa o primeiro convite com valor válido', () => {
    expect(resolveShortlistSize([{}, { shortlist_size: 4 }, { shortlist_size: 9 }])).toBe(4);
  });
});
