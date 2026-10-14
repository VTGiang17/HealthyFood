import { get, patch } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";
import type { ApiResponse } from "@/libs/adminHelpers";

export type UserRole = "admin" | "customer";
export type UserStatus = "active" | "blocked";

export interface AdminUser {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/admin/user
export const getAdminUsers = () =>
  get<ApiResponse<unknown>>(API_PATH.ADMIN.USER.BASE);

// GET /api/admin/user/[id]
export const getAdminUserDetail = (id: string) =>
  get<ApiResponse<AdminUser>>(API_PATH.ADMIN.USER.DETAIL(id));

// PATCH /api/admin/user/[id]/status
export const updateUserStatus = (id: string, status: UserStatus) =>
  patch<ApiResponse<AdminUser>>(API_PATH.ADMIN.USER.STATUS(id), { status });

// PATCH /api/admin/user/[id]/role
export const updateUserRole = (id: string, role: UserRole) =>
  patch<ApiResponse<AdminUser>>(API_PATH.ADMIN.USER.ROLE(id), { role });
