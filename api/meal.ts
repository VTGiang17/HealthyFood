import { get, post, put, del } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

export interface MealPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MealIngredient {
  ingredient_id:
    | string
    | {
        _id: string;
        name: string;
        image_url?: string;
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

export interface MealListResponse {
  success: boolean;
  message: string;
  data: Meal[];
}

export interface PaginatedMealsResponse {
  success: boolean;
  message: string;
  data: Meal[];
  pagination: MealPagination;
}

export interface GetMealsPageParams {
  page: number;
  limit?: number;
  search?: string;
  calorieFilter?: "all" | "under300" | "300to500" | "over500";
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "priceAsc" | "priceDesc" | "calAsc";
}

type ApiResult<T> = { success: boolean; message?: string; data: T };

export const getMealDetail = (id: string) =>
  get<ApiResult<Meal>>(API_PATH.MEAL.DETAIL(encodeURIComponent(id)));

export const getRecommendedMeals = () => {
  return get<MealListResponse>(API_PATH.MEAL.LIST, {
    params: {
      isRecommended: true,
      limit: 4,
    },
  });
};

export const getMealsPage = (params: GetMealsPageParams) =>
  get<PaginatedMealsResponse>(API_PATH.MEAL.LIST, {
    params: { ...params, limit: 9 },
  });
