/**
 * O que fazer ao estado do técnico quando a localização deixa de funcionar
 * (sem a permissão "Sempre", GPS desligado, a tarefa de fundo não arranca).
 *
 * Só se tira quem está Online: sem posição o cliente não o vê a caminho e não
 * deve ser proposto a pedidos novos. NUNCA se põe ninguém Online. Até 09/10/2026
 * o Início ALTERNAVA o estado (`Online ? Offline : Online`):
 * - Offline a caminho de um serviço aceite: a app mandava "Online" sozinha. O
 *   servidor recusa (um serviço aberto impede aceitar outros) e o técnico via
 *   "Não foi possível mudar o teu estado" no lugar do aviso da localização.
 * - Ao voltar à app, o estado usado era o do primeiro render, ainda por
 *   carregar, e a alternância mandava sempre "Online": quem estava Online sem
 *   localização continuava Online em vez de sair.
 *
 * Devolve o estado para onde mudar, ou `null` para não mexer.
 */
export type EstadoDoTecnico = 'Online' | 'Offline';

export const estadoAoFalharLocalizacao = (
  atual?: EstadoDoTecnico | null,
): 'Offline' | null => (atual === 'Online' ? 'Offline' : null);
