import { get, post } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

export interface RegisterCustomerInput {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface RegisterCustomerResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    full_name: string;
    email: string;
    role: "admin" | "customer";
  };
}

export interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: "admin" | "customer";
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfile;
}

type ApiResult<T> = { success: boolean; message?: string; data: T };

export const customerLogin = (email: string, password: string) =>
  post<ApiResult<unknown>>(API_PATH.AUTH.LOGIN, { email, password });

export const registerCustomer = (data: RegisterCustomerInput) =>
  post<RegisterCustomerResponse>("/api/auth/register", data);

export const getCustomerProfile = () => get<ProfileResponse>("/api/auth/me");
