/**
 * As perguntas sobre a AT e os outros dados de faturação (IBAN, morada) que a
 * app faz mais do que uma vez.
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
export const dinheiroRetido = (payoutBlocked?: boolean): boolean =>
  payoutBlocked === true;

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

/**
 * O IBAN e a morada de faturação já se pedem?
 *
 * Desde 13/10/2026 têm a fronteira da AT (servidor: `Vendor::faturacaoEmDia`):
 * só são obrigatórios a partir do 3.º serviço concluído, e o mesmo
 * `at_required` responde pelos três. Antes disso pedem-se só a quem já tem
 * dinheiro à espera deles — sem IBAN e sem morada fiscal a Piquet não lhe pode
 * transferir nada, e calar isso era deixá-lo sem saber porque não recebe.
 *
 * Mesma assimetria das outras duas: `atRequired !== false`, porque um servidor
 * antigo exige os dois desde o primeiro dia e o erro seguro é pedir;
 * `payoutBlocked === true`, porque só se fala de dinheiro retido quando o
 * servidor o afirma.
 *
 * Responde a "pede-se?", não a "falta?": quem chama ainda verifica o campo.
 */
export const pedeFaturacaoNoPerfil = (atRequired?: boolean, payoutBlocked?: boolean): boolean =>
  atRequired !== false || payoutBlocked === true;

/** Falta o IBAN ou a morada de faturação, e já se pedem. */
export const faltaFaturacaoNoPerfil = (
  iban?: string | null,
  companyAddress?: string | null,
  atRequired?: boolean,
  payoutBlocked?: boolean,
): boolean => (!iban || !companyAddress) && pedeFaturacaoNoPerfil(atRequired, payoutBlocked);

/**
 * Este técnico já executou algum serviço?
 *
 * Não há contagem de serviços no perfil, mas há duas coisas que a implicam:
 * `at_required` só fica verdadeiro ao 3.º concluído, e
 * `services_until_at_required` é `3 - concluídos` — abaixo de 3 significa que
 * pelo menos um serviço já foi feito.
 *
 * Serve para o "completa o teu perfil" não dizer "para COMEÇARES a receber
 * pedidos" a quem já recebeu e já trabalhou. Para esse, o perfil incompleto não
 * é a porta de entrada: é uma porta que se fechou.
 *
 * Na dúvida (servidor antigo, campos ausentes) assume que NÃO trabalhou — o
 * texto de entrada é o que a app sempre disse, e errar para o lado conhecido é
 * melhor do que dizer "volta a receber" a quem nunca recebeu nada.
 */
export const jaExecutouServicos = (atRequired?: boolean, servicosAteAAt?: number): boolean =>
  atRequired === true || (typeof servicosAteAAt === 'number' && servicosAteAAt < 3);
