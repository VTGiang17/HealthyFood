import { get, post, put, del } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const getCategories = async () => {
  return get<ApiResponse<Category[]>>(API_PATH.ADMIN.CATEGORY.BASE);
};

export const createCategory = async (data: CategoryPayload) => {
  return post<ApiResponse<Category>>(API_PATH.ADMIN.CATEGORY.BASE, data);
};

export const updateCategory = async (id: string, data: CategoryPayload) => {
  return put<ApiResponse<Category>>(API_PATH.ADMIN.CATEGORY.DETAIL(id), data);
};

export const deleteCategory = async (id: string) => {
  return del<ApiResponse<null>>(API_PATH.ADMIN.CATEGORY.DETAIL(id));
};
