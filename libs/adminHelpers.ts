import axios from "axios";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export function getList<T>(payload: unknown, collectionKey: string): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const result = payload as Record<string, unknown>;
  const data = "data" in result ? result.data : result;

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object") {
    const value = data as Record<string, unknown>;

    for (const key of [collectionKey, "items", "results"]) {
      if (Array.isArray(value[key])) {
        return value[key] as T[];
      }
    }

    if (Array.isArray(value.data)) {
      return value.data as T[];
    }
  }

  return [];
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Không thể thực hiện yêu cầu"
    );
  }

  return error instanceof Error ? error.message : "Đã xảy ra lỗi";
}

export function money(value: number = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getId(
  value: string | { _id: string } | null | undefined
): string {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

export function createFormData(values: object, image?: File | null): FormData {
  const data = new FormData();

  data.append("data", JSON.stringify(values));

  if (image) {
    data.append("image", image);
  }

  return data;
}
