import { get, post } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

export interface AdminUser {
  _id: string;
  full_name: string;
  email: string;
  avatar?: string;
  role: "admin" | "customer";
  status: "active" | "blocked";
}

export interface AuthResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface LoginResult {
  user?: AdminUser;
}

export const loginAdmin = async (email: string, password: string) => {
  const response = await post<AuthResponse<LoginResult>>(API_PATH.AUTH.LOGIN, {
    email,
    password,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || "Đăng nhập thất bại");
  }

  const user = response.data.data?.user;

  if (user && (user.role !== "admin" || user.status !== "active")) {
    await logoutAdmin().catch(() => undefined);

    throw new Error("Tài khoản không có quyền quản trị");
  }

  return response.data;
};

export const getAdminProfile = async () => {
  const response = await get<AuthResponse<AdminUser | { user: AdminUser }>>(
    API_PATH.AUTH.ME,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error("Không thể xác thực tài khoản");
  }

  const data = response.data.data;

  const user = "user" in data ? data.user : data;

  return user;
};

export const logoutAdmin = async () => {
  return post(API_PATH.AUTH.LOGOUT);
};
