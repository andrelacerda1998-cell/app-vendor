/**
 * Quando avisar o técnico de que o cliente o escolheu e pagou ("Serviço
 * confirmado!") e levá-lo ao ecrã de execução.
 *
 * Num pedido com escolha de profissional, o técnico diz "tenho disponibilidade"
 * e o cliente escolhe e paga depois — às vezes minutos depois. O serviço só
 * passa a ser o serviço aberto dele nesse momento, e nada o chamava.
 *
 * Só se avisa por um serviço que ele ainda não conhecia nesta sessão. Ficam de
 * fora:
 * - o que já estava em curso ao abrir a app (a primeira carga é o ponto de
 *   partida, não uma novidade);
 * - o que ele próprio acabou de aceitar (pedido direto, ou um agendado que
 *   arrancou) — esses ecrãs já dão o seu aviso;
 * - um agendado que fica ativo no dia: foi aceite há muito;
 * - um serviço que já vai a caminho, já chegou ou já acabou.
 */
import { ServiceStatus } from '@/types/services';

export type ServicoAberto = {
  id?: number | string | null;
  status?: string | null;
  is_immediate?: boolean | null;
  schedule_id?: number | null;
  schedule?: { scheduled_day?: string | null } | null;
};

/** A mesma regra do `isImmediateRequest` (utils/requestTiming): imediato == sem agendamento. */
const eImediato = (servico: ServicoAberto) =>
  typeof servico.is_immediate === 'boolean'
    ? servico.is_immediate
    : !(servico.schedule_id || servico.schedule?.scheduled_day);

export const deveAnunciarServicoConfirmado = (
  servico: ServicoAberto | null | undefined,
  conhecidos: ReadonlySet<string>,
  primeiraCargaFeita: boolean,
): boolean => {
  if (!servico || servico.id == null) return false;
  if (!primeiraCargaFeita) return false;
  if (conhecidos.has(String(servico.id))) return false;
  if (servico.status !== ServiceStatus.ACCEPTED) return false;
  return eImediato(servico);
};
