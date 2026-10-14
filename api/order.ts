import { post } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

export interface CreateOrderPayload {
  receiver_name: string;
  phone: string;
  address: string;
  note?: string;
  payment_method: "cod";
}

interface CreateOrderResponse {
  success: boolean;
  message?: string;
  data: {
    _id: string;
    status?: string;
    total_price?: number;
  };
}

export const createOrder = (payload: CreateOrderPayload) =>
  post<CreateOrderResponse>(API_PATH.ORDER.BASE, payload);
