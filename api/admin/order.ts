import { get, patch } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";
import type { ApiResponse } from "@/libs/adminHelpers";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

export interface OrderItem {
  _id?: string;
  name?: string;
  meal_name?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  subtotal?: number;
  meal_id?:
    | string
    | {
        _id: string;
        name: string;
        image_url?: string;
      };
  calories?: number;
}

export interface AdminOrder {
  _id: string;
  user_id?:
    | string
    | {
        _id: string;
        full_name?: string;
        name?: string;
        email?: string;
        phone?: string;
      };

  receiver_name?: string;
  customer_name?: string;
  phone?: string;
  address?: string;
  shipping_address?:
    | string
    | {
        full_name?: string;
        phone?: string;
        address?: string;
      };
  note?: string;

  items: OrderItem[];
  total_price?: number;
  total_amount?: number;

  status: OrderStatus;
  payment_method?: string;
  payment_status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/admin/order
export const getAdminOrders = () =>
  get<ApiResponse<unknown>>(API_PATH.ADMIN.ORDER.BASE);

// GET /api/admin/order/[id]
export const getAdminOrderDetail = (id: string) =>
  get<ApiResponse<AdminOrder>>(API_PATH.ADMIN.ORDER.DETAIL(id));

// PATCH /api/admin/order/[id]/status
export const updateOrderStatus = (id: string, status: OrderStatus) =>
  patch<ApiResponse<AdminOrder>>(API_PATH.ADMIN.ORDER.STATUS(id), { status });
