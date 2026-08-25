import { Colors } from '@/constants/Colors';

export type UrgencyTone = 'calm' | 'warning' | 'critical';

/**
 * Cor de um contador de resposta.
 *
 * Âmbar -> laranja -> vermelho. Fica dentro da paleta da marca em vez de saltar
 * para verde: o verde dizia "está tudo bem" quando a mensagem é o contrário —
 * há um pedido à espera e responder cedo é melhor para o cliente. O âmbar já é
 * um chamamento, e a escala aquece a partir dele.
 *
 * Partilhado entre a Home e o cartão do pedido para os dois nunca discordarem
 * sobre o que é urgente.
 */
export const urgencyInk = (tone: UrgencyTone): string => {
  switch (tone) {
    case 'critical':
      return Colors.danger;
    case 'warning':
      return Colors.warning;
    default:
      return Colors.brand;
  }
};

/** Fundo tonal correspondente, para pílulas e ícones. */
export const urgencyTint = (tone: UrgencyTone): string => `${urgencyInk(tone)}1F`;
