/**
 * As duas perguntas sobre a AT que a app faz mais do que uma vez.
 *
 * Vivem aqui, e não em linha nos ecrãs, por causa de uma assimetria que parece
 * um erro de escrita e não é: uma compara com `=== true` e a outra com
 * `!== false`. Em linha, no meio de JSX, a primeira pessoa a "arrumar" isto
 * escreve `!` nas duas — e cada um dos dois lados falha para o lado errado.
 *
 * O campo é opcional porque um servidor anterior a 30/09/2026 não o manda.
 */

/**
 * Mostrar o aviso de dinheiro retido?
 *
 * `=== true`: só quando o servidor o afirma. Num servidor antigo não há retenção
 * nenhuma a acontecer, e um aviso a dizer que o dinheiro dele está preso seria
 * falso — e é o pior tipo de falso, porque é sobre o dinheiro dele.
 */
export const dinheiroRetidoPelaAt = (payoutBlockedByAt?: boolean): boolean =>
  payoutBlockedByAt === true;

/**
 * O "completa o teu perfil" deve contar a AT como coisa em falta?
 *
 * `!== false`: só se CALA quando o servidor diz, em concreto, que ainda não é
 * exigida. Sem resposta assume-se que é — o comportamento antigo. Ao contrário
 * do aviso do dinheiro, o erro seguro aqui é pedir a mais: pedir a AT cedo é uma
 * chatice, deixar de a pedir a quem já é exigida é um técnico parado sem saber
 * porquê.
 */
export const pedeAtNoPerfil = (atUser?: string | null, atRequired?: boolean): boolean =>
  !atUser && atRequired !== false;
