import { get, post, put, del } from "@/libs/axios";

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
export const getCart = () => get<ApiResponse<CartData>>("/api/cart");

// Thêm món có sẵn vào giỏ
export const addMealToCart = (mealId: string, quantity = 1) =>
  post<ApiResponse<CartData>>("/api/cart", {
    type: "meal",
    meal_id: mealId,
    quantity,
  });

// Cập nhật số lượng
export const updateCartQuantity = (itemId: string, quantity: number) =>
  put<ApiResponse<CartData>>(`/api/cart/items/${itemId}`, { quantity });

// Xóa một dòng trong giỏ
export const removeCartItem = (itemId: string) =>
  del<ApiResponse<CartData>>(`/api/cart/items/${itemId}`);
