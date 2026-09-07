import { UserAddressInterface, UserInterface, VendorDataInterface } from "../session";

export interface OperationArea {
  id: number;
  name: string;
  services_types?: ServiceTypeInterface[];
  services_types_subscribed?: ServiceTypeInterface['id'][];
}

export enum ServiceStatus {
  PENDING = 'Pending',
  SCHEDULED = 'Scheduled',
  CANCELED = 'Canceled',
  ACCEPTED = 'Accepted',
  CLOSED = 'Closed',
  REFUSED = 'Refused',
  FINISHED = 'Finished',
  ARRIVED = 'Arrived',
  REFUSED_MBWAY = 'RefusedMbway',
  EXPIRED_MBWAY = 'ExpiredMbway',
  CANCELED_MBWAY = 'CanceledMbway',
}

export interface OpenServiceInterface {
  id: number,
  amount: number,
  amount_for_vendor: number,
  distance: number,
  service_type: ServiceTypeInterface | null,
  service_area: OperationArea,
  customer: UserInterface,
  vendor: VendorDataInterface,
  address: AdressInterface,
  status: ServiceStatus,
}

export interface ServiceInterface {
  id: number,
  rate: number,
  distance: number,
  service_type: ServiceTypeInterface | null,
  service_area: OperationArea,
  amount: number,
  amount_for_vendor: number,
  customer: UserInterface,
  rating_by_vendor: number,
  created_at: string,
  updated_at: string,
  invoice_id?: number | null,
  status: ServiceStatus | null,
  address: AdressInterface | null,
  invoice?:string,
  server_time?: string,
  /** Observações escritas pelo cliente ao abrir o pedido (formatDataForVendor). */
  customer_notes?: string | null,
  /**
   * Fotos que o cliente juntou ao pedir (Service::customerPhotosPayload).
   * URL assinados e temporários — não guardar nem partilhar fora do ecrã.
   */
  customer_photos?: { id: number; url: string }[] | null,
  schedule?: {
    scheduled_day: string;
    date_label: string;
    scheduled_time: {
      start: string;
      end: string;
    };
    /** Quando o técnico confirmou que vai; null enquanto não confirmar. */
    vendor_confirmed_at?: string | null;
  } | null,
}

export interface AdressInterface {
  id: number;
  name: string;
  address: string;
  additional_info: string | null;
  street_name: string | null;
  /** Número da porta (formatVendorAddress). */
  street_number?: string | null;
  city: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface ServiceTypeInterface {
  id: number;
  name: string;
  /**
   * Duração estimada em minutos. Opcional porque o endpoint do vendor
   * (`/vendor/services/operation-areas`) ainda NÃO devolve este campo — só o do cliente.
   */
  time?: number | null;
  description?: string;
  operation_area_id?: OperationArea['id'];
  /** Preço "desde" (€) do catálogo. Também só devolvido no endpoint do cliente. */
  starts_from?: number | null;
  suggested_price?: string;
  current_price?: string;
}

/** Espelha App\Enums\Schedule\ScheduleRecurrence no backend. */
export type ScheduleRecurrence = "weekly" | "biweekly" | "monthly";

export interface ServiceRequestedInterface {
  customer: {
    id: number;
    name: string;
    address: string;
    /** Só depois de a marcação estar confirmada (ver ServiceRequestedData). */
    phone?: string | null;
  };
  amount?: number | null;
  amount_for_vendor?: number | null;
  schedule: {
    scheduled_day: string;
    date_label: string;
    scheduled_time: {
      start: string;
      end: string;
    };
    /** Quando o técnico confirmou que vai; null enquanto não confirmar. */
    vendor_confirmed_at?: string | null;
    /** De quanto em quanto tempo se repete. Null numa marcação avulsa. */
    recurrence?: ScheduleRecurrence | null;
    /**
     * True também nas ocorrências seguintes de uma série, que herdam
     * `recurrence_parent_id` sem `recurrence` própria — por isso não basta
     * olhar para `recurrence`.
     */
    is_recurring?: boolean;
  };
  service_type: {
    id: number;
    name: string;
    /** Duração estimada em minutos (ServiceType::time). Pode não vir no payload. */
    time?: number | null;
    /** O que está combinado fazer, já traduzido. */
    includes?: string[] | null;
    /** O que NÃO está combinado — é aqui que nascem as discussões à porta. */
    excludes?: string[] | null;
  };
  service_id: number;
  //added to handle the countdown counters
  created_at?: number;
  server_time?: string;
  schedule_id?: number;
  /** Vem do backend (Service::formatDataForVendor). Quando ausente, derivamos de `schedule`. */
  is_immediate?: boolean;
  /** Distância vendor→morada do serviço, em QUILÓMETROS (helpers/distance.php). */
  distance?: number | null;
  /**
   * Morada completa do serviço (ServiceRequestedData::address_details /
   * Service::formatVendorAddress). Campos individualmente opcionais — omite-se
   * o que o backend não souber, nunca se inventa.
   */
  address_details?: ServiceAddressDetails | null;
  /** Observações escritas pelo cliente ao abrir o pedido. */
  customer_notes?: string | null;
  /**
   * Fotos que o cliente juntou ao pedir (Service::customerPhotosPayload).
   * URL assinados e temporários — não guardar nem partilhar fora do ecrã.
   */
  customer_photos?: { id: number; url: string }[] | null;
}

export interface ServiceAddressDetails {
  name?: string | null;
  street_name?: string | null;
  street_number?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  additional_info?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}
