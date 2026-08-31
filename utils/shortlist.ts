/**
 * Quantos aceites chegam ao cliente ("só os N primeiros a aceitar").
 *
 * O número vem do backend em cada convite (matching.shortlist_size). Esteve
 * escrito à mão no texto da app — bastava mudar a definição no backoffice para
 * a app prometer ao profissional uma coisa que já não era verdade, e ninguém se
 * lembraria de trocar a tradução.
 */

/** Valor por omissão do backend. Só se usa se a resposta não trouxer o campo. */
export const DEFAULT_SHORTLIST_SIZE = 3;

/**
 * O tamanho anunciado, a partir dos convites recebidos.
 *
 * Lê o primeiro convite que traga um valor válido: numa app nova contra um
 * backend antigo o campo não vem, e prometer "0 primeiros" seria pior do que
 * assumir o valor por omissão.
 */
export const resolveShortlistSize = (
  invitations: Array<{ shortlist_size?: number | null }> | null | undefined,
): number => {
  if (!Array.isArray(invitations)) return DEFAULT_SHORTLIST_SIZE;

  const found = invitations.find(
    (i) => typeof i?.shortlist_size === 'number' && Number.isFinite(i.shortlist_size) && i.shortlist_size! > 0,
  );

  return found?.shortlist_size ?? DEFAULT_SHORTLIST_SIZE;
};
