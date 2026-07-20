import { ServiceInterface } from "../services";

export interface PaymentHistoryInterface {
  id: string;
  type: string;
  amount: number;
  amount_formatted: string;
  confirmed: boolean;
  service: ServiceInterface & {
    id: string;
    description: string;
    admin_description: string;
  };
  created_at: string;
  updated_at: string;
}