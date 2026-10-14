import { post } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

export interface BowlIngredientInput {
  ingredient_id: string;
  quantity: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export const addCustomBowlToCart = (
  ingredients: BowlIngredientInput[],
  quantity = 1
) =>
  post<ApiResponse>(API_PATH.CART.BASE, {
    type: "custom",
    ingredients,
    quantity,
  });
