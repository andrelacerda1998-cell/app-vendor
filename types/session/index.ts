export interface VendorDataInterface {
  can_accept_service: boolean;
  documents: any[];
  last_cc: any;
  last_criminal_record: any;
  price_rate: number;
  username: string;
  name: string;
  user_id: number;
  status: "Online" | "Offline";
  user: UserInterface;
  // current_location: {
  //   latitude: number;
  //   longitude: number;
  // },
  location: {
    latitude: number;
    longitude: number;
  },
  current_location?: {
    latitude: number;
    longitude: number;
  },
  pending_documents: DocumentsInterface[],
  missing_documents: DocumentsInterface[],
  optional_documents: DocumentsInterface[],
  iban: string | null;
  company_name: string | null;
  nif: string | null;
  company_address: string | null;
  /**
   * Morada de onde o tecnico sai para um servico AGENDADO — a base da
   * distancia, e logo do preco, de todos os agendados. Distinta da fiscal,
   * que serve a facturacao.
   */
  schedule_address?: string | null;
  at_user: string | null;
  /**
   * O acesso à AT já é exigido — os três primeiros serviços acabaram.
   *
   * Opcional porque um servidor anterior a 30/09/2026 não manda o campo. Quem o
   * lê deve comparar com `=== true` / `=== false`, nunca com `!`: um `undefined`
   * tratado como "não exigido" abria o portão a toda a gente.
   */
  at_required?: boolean;
  /** Quantos serviços ainda pode fazer antes de a AT o travar. 0 = já trava. */
  services_until_at_required?: number;
  /**
   * O dinheiro dos serviços já feitos está na carteira e não sai.
   *
   * Vem à parte do `account_blocker`: esse responde "o que te falta para
   * trabalhares", que é uma lista maior. O dinheiro só fica retido pelo que
   * impede FATURAR — IBAN, morada fiscal, AT. Mesma regra do `at_required`:
   * comparar com `=== true`.
   */
  payout_blocked?: boolean;
  /** Qual dos três: `iban_missing` | `fiscal_address_missing` | `at_user_missing`. */
  payout_blocker?: 'iban_missing' | 'fiscal_address_missing' | 'at_user_missing' | null;
  /**
   * Quando acaba o prazo para dar a AT antes de o dinheiro se perder (ISO 8601).
   *
   * Vem a DATA e não os dias que faltam: um número calculado no servidor
   * congela no momento do pedido, e a app que fique aberta ao virar da
   * meia-noite continuava a dizer "faltam 2" quando já só falta 1. Com a data,
   * quem conta é quem mostra.
   */
  at_deadline_ends_at?: string | null;
  /**
   * Termos: que versão está em vigor, qual ele aceitou, e se falta aceitar.
   *
   * Isto não é decoração legal: o servidor NÃO conta o prazo da perda a quem
   * não aceitou a versão em vigor. Sem aceitação há retenção, mas não há perda.
   */
  terms_version_required?: string | null;
  terms_version_accepted?: string | null;
  terms_acceptance_required?: boolean;
  /**
   * Pedidos criados na zona do técnico nos últimos 7 dias. Só vem preenchido
   * para quem ainda não pode aceitar serviços — para os aprovados é `null`.
   */
  zone_recent_requests?: number | null;
  /** Cidades escolhidas para trabalhar. Sinal persistente do passo das cidades no onboarding. */
  available_cities_count?: number | null;
  at_valid: boolean;
}

interface DocumentsInterface {
  id: number;
  name: string;
  reason?: string | null;
}

export interface UserInterface {
  id: number;
  address: UserAddressInterface | null;
  notifications: number;
  // avatar_url: string | null;
  // can_request_service: boolean;
  date_birthday: string;
  email: string;
  email_verified_at: string;
  gender_id: string | number | null;
  language: string;
  first_name: string;
  last_name: string;
  name: string;
  nif: string;
  phone_number: string;
  phone_number_verified_at: string;
  avatar: {
    small: string;
    src: string;
  } | null;
  // phone_number_verified_at: string;
  // two_factor_confirmed_at: string | null;
  // two_factor_recovery_codes: string | null;
  // two_factor_secret: string | null;
  // two_factor_type: string | null;
}

export interface UserAddressInterface {
  city: string;
  country: string;
  created_at: string;
  deleted_at: string | null;
  id: number;
  latitude: number;
  longitude: number;
  main_address: number;
  name: string;
  postal_code: string;
  state: string;
  street_name: string;
  street_number: string;
  updated_at: string;
}

export interface WalletInterface {
  balanceFloat: string;
  decimal_places: number;
  name: string;
  slug: string;
}
