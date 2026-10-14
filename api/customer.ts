import { get, post } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";
import type { Meal } from "@/api/admin/meal";

type ApiResult<T> = { success: boolean; message?: string; data: T };

export const getMealDetail = (id: string) =>
  get<ApiResult<Meal>>(API_PATH.MEAL.DETAIL(encodeURIComponent(id)));

export const customerLogin = (email: string, password: string) =>
  post<ApiResult<unknown>>(API_PATH.AUTH.LOGIN, { email, password });
