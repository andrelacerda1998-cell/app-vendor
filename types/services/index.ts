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
  schedule?: {
    scheduled_day: string;
    date_label: string;
    scheduled_time: {
      start: string;
      end: string;
    };
  } | null,
}

export interface AdressInterface {
  id: number;
  name: string;
  address: string;
  additional_info: string | null;
  street_name: string | null;
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

export interface ServiceRequestedInterface {
  customer: {
    id: number;
    name: string;
    address: string;
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
  };
  service_type: {
    id: number;
    name: string;
    /** Duração estimada em minutos (ServiceType::time). Pode não vir no payload. */
    time?: number | null;
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
