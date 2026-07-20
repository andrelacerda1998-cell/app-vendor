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
  pending_documents: DocumentsInterface[],
  missing_documents: DocumentsInterface[],
  optional_documents: DocumentsInterface[],
  iban: string | null;
  company_name: string | null;
  nif: string | null;
  company_address: string | null;
  at_user: string | null;
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
