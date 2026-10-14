import { get, post, put, del } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

export interface CartItem {
  _id: string;
  type: "meal" | "custom";
  meal_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  image_url?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  available?: boolean;
  error?: string;
}

export interface CartData {
  items: CartItem[];
  totals?: {
    quantity?: number;
    price?: number;
    calories?: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Lấy giỏ hàng
export const getCart = () => get<ApiResponse<CartData>>(API_PATH.CART.BASE);

// Thêm món có sẵn vào giỏ
export const addMealToCart = (mealId: string, quantity = 1) =>
  post<ApiResponse<CartData>>(API_PATH.CART.BASE, {
    type: "meal",
    meal_id: mealId,
    quantity,
  });

// Cập nhật số lượng
export const updateCartQuantity = (itemId: string, quantity: number) =>
  put<ApiResponse<CartData>>(API_PATH.CART.ITEM(itemId), { quantity });

// Xóa một dòng trong giỏ
export const removeCartItem = (itemId: string) =>
  del<ApiResponse<CartData>>(API_PATH.CART.ITEM(itemId));
