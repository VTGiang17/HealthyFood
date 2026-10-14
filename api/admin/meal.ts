import { get, post, put, del } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

import { ApiResponse, createFormData } from "@/libs/adminHelpers";

export interface MealIngredient {
  ingredient_id:
    | string
    | {
        _id: string;
        name: string;
      };
  quantity: number;
}

export interface Meal {
  _id: string;
  name: string;
  description?: string;
  image_url?: string;

  calories?: number | null;

  ingredients: MealIngredient[];

  is_active: boolean;
  is_recommended: boolean;

  totals?: {
    price: number;
    calories: number;

    calculated_calories?: number;

    protein?: number;
    carbs?: number;
    fat?: number;
  };

  createdAt?: string;
  updatedAt?: string;
}

export interface MealPayload {
  name: string;
  description: string;
  image_url?: string;

  calories?: number | null;

  ingredients: {
    ingredient_id: string;
    quantity: number;
  }[];

  is_active: boolean;
  is_recommended: boolean;
}

export interface MealListResponse {
  success: boolean;
  message: string;
  data: Meal[];
}

export const getRecommendedMeals = () => {
  return get<MealListResponse>(API_PATH.MEAL.LIST, {
    params: {
      isRecommended: true,
      limit: 4,
    },
  });
};

// GET /api/meal
export const getMeals = () => {
  return get<ApiResponse<unknown>>(API_PATH.MEAL.LIST);
};

// POST /api/admin/meal
export const createMeal = (data: MealPayload, image?: File | null) => {
  return post<ApiResponse<Meal>>(
    API_PATH.ADMIN.MEAL.CREATE,
    createFormData(data, image)
  );
};

// PUT /api/admin/meal/[id]
export const updateMeal = (
  id: string,
  data: MealPayload,
  image?: File | null
) => {
  return put<ApiResponse<Meal>>(
    API_PATH.ADMIN.MEAL.UPDATE(id),
    createFormData(data, image)
  );
};

// DELETE /api/admin/meal/[id]
export const deleteMeal = (id: string) => {
  return del<ApiResponse<null>>(API_PATH.ADMIN.MEAL.DELETE(id));
};
