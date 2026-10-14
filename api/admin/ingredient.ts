import { get, post, put, del } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";
import { ApiResponse, createFormData } from "@/libs/adminHelpers";

export interface Nutrition {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Ingredient {
  _id: string;
  name: string;
  description?: string;
  category_id:
    | string
    | {
        _id: string;
        name: string;
      };
  image_url?: string;
  price_per_100g: number;
  min_grams: number;
  max_grams: number;
  step_grams: number;
  nutrition: Nutrition;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IngredientPayload {
  name: string;
  description: string;
  category_id: string;
  image_url?: string;
  price_per_100g: number;
  min_grams: number;
  max_grams: number;
  step_grams: number;
  nutrition: Nutrition;
  is_active: boolean;
}

// GET công khai
export const getIngredients = () =>
  get<ApiResponse<unknown>>(API_PATH.INGREDIENT.LIST);

// POST Admin
export const createIngredient = (
  data: IngredientPayload,
  image?: File | null
) =>
  post<ApiResponse<Ingredient>>(
    API_PATH.ADMIN.INGREDIENT.CREATE,
    createFormData(data, image)
  );

// PUT /[id]
export const updateIngredient = (
  id: string,
  data: IngredientPayload,
  image?: File | null
) =>
  put<ApiResponse<Ingredient>>(
    API_PATH.ADMIN.INGREDIENT.UPDATE(id),
    createFormData(data, image)
  );

// DELETE /[id]
export const deleteIngredient = (id: string) =>
  del<ApiResponse<null>>(API_PATH.ADMIN.INGREDIENT.DELETE(id));
