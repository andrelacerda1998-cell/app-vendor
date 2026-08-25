import { Colors } from '@/constants/Colors';

export type UrgencyTone = 'calm' | 'warning' | 'critical';

/**
 * Cor de um contador de resposta.
 *
 * Verde não é "está tudo bem, não faças nada": é "ainda vais a tempo". A escala
 * existe porque responder cedo é melhor para o cliente — ele escolhe mais
 * depressa e espera menos — por isso a cor acompanha a janela inteira em vez de
 * só avisar no fim.
 *
 * Partilhado entre a Home e o cartão do pedido para os dois nunca discordarem
 * sobre o que é urgente.
 */
export const urgencyInk = (tone: UrgencyTone): string => {
  switch (tone) {
    case 'critical':
      return Colors.danger;
    case 'warning':
      return Colors.brand;
    default:
      return Colors.success;
  }
};

/** Fundo tonal correspondente, para pílulas e ícones. */
export const urgencyTint = (tone: UrgencyTone): string => `${urgencyInk(tone)}1F`;
