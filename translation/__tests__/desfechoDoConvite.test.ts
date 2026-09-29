/**
 * As chaves do desfecho existem e dizem alguma coisa.
 *
 * A paridade pt↔en garante que as duas árvores têm o MESMO conjunto de chaves.
 * Não garante que estas existam: se o `useMatchingInvitations` pedir uma chave
 * que ninguém escreveu, o i18next não rebenta — devolve o caminho em cru
 * ("matching.outcome.lost_title") e é isso que o técnico lê no diálogo.
 *
 * Este ficheiro prende, por caminho exacto, as quatro que o hook usa quando o
 * cliente escolhe outro profissional ou não paga a tempo. São o único aviso que
 * ele recebe nesses dois casos: sem push, e com o cartão já fora da lista.
 */
import ptPT from '@/translation/resources/pt_PT';
import enUS from '@/translation/resources/en_US';

const CAMINHOS = [
  'matching.outcome.lost_title',
  'matching.outcome.lost_subtitle',
  'matching.outcome.closed_title',
  'matching.outcome.closed_subtitle',
] as const;

const em = (arvore: Record<string, any>, caminho: string): unknown =>
  caminho.split('.').reduce<any>((no, parte) => no?.[parte], arvore);

describe('mensagem de desfecho do convite', () => {
  for (const [nome, arvore] of [['pt_PT', ptPT], ['en_US', enUS]] as const) {
    describe(nome, () => {
      for (const caminho of CAMINHOS) {
        it(`${caminho} tem texto`, () => {
          const texto = em(arvore as Record<string, any>, caminho);

          expect(typeof texto).toBe('string');
          expect((texto as string).trim().length).toBeGreaterThan(0);
        });
      }
    });
  }

  /**
   * Os dois desfechos têm de se distinguir. "Perdeste" e "o cliente não pagou"
   * são situações diferentes para quem bloqueou a agenda, e um texto copiado de
   * um para o outro passaria a paridade e o teste de existência sem problema.
   */
  it('os dois desfechos não dizem a mesma coisa', () => {
    for (const arvore of [ptPT, enUS]) {
      expect(em(arvore as Record<string, any>, 'matching.outcome.lost_title'))
        .not.toBe(em(arvore as Record<string, any>, 'matching.outcome.closed_title'));
      expect(em(arvore as Record<string, any>, 'matching.outcome.lost_subtitle'))
        .not.toBe(em(arvore as Record<string, any>, 'matching.outcome.closed_subtitle'));
    }
  });
});
