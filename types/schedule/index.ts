export interface ScheduledServiceInterface {
  id: number;
  vendor_id: number;
  customer_id: number;
  scheduled_day: string;
  name: string;
  scheduled_time: {
    start: string;
    end: string;
  };
  service_type: {
    id: number;
    name: {
      en_US: string;
      pt_PT: string;
    }
  };
  service_id: number;
  customer_address: string;
  date_label: string;
  //added to handle the countdown counters
  created_at?: number;
}

export type WeekdayConfig = {
  key: string;
  label: string;
  enabled: boolean;
  start: string; // HH:mm
  end: string;   // HH:mm
};

export type AddressData = {
  street: string;
  number: string;
  city: string;
  postalCode: string;
};