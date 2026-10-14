import { get, post, put, del } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPayload {
  name: string;
  description: string;
  image_url?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type CategoryListData =
  | Category[]
  | {
      categories?: Category[];
      items?: Category[];
      total?: number;
    };

// GET /api/category
export const getCategories = () => {
  return get<ApiResponse<CategoryListData>>(API_PATH.CATEGORY.LIST);
};

// POST /api/admin/category
export const createCategory = (
  values: CategoryPayload,
  image?: File | null
) => {
  const formData = new FormData();

  formData.append("data", JSON.stringify(values));

  if (image) {
    formData.append("image", image);
  }

  return post<ApiResponse<Category>>(API_PATH.ADMIN.CATEGORY.CREATE, formData);
};

// PUT /api/admin/category/[id]
export const updateCategory = (
  id: string,
  values: CategoryPayload,
  image?: File | null
) => {
  const formData = new FormData();

  formData.append("data", JSON.stringify(values));

  if (image) {
    formData.append("image", image);
  }

  return put<ApiResponse<Category>>(
    API_PATH.ADMIN.CATEGORY.UPDATE(id),
    formData
  );
};

// DELETE /api/admin/category/[id]
export const deleteCategory = (id: string) => {
  return del<ApiResponse<null>>(API_PATH.ADMIN.CATEGORY.DELETE(id));
};
