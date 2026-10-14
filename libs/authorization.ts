import "server-only";
import mongoose from "mongoose";

import { getCurrentUser } from "@/libs/auth";
import { getUserById } from "@/services/auth.service";
import { connectDB } from "@/libs/mongo";

export class AuthorizationError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

export async function requireUser() {
  const payload = await getCurrentUser();

  if (!payload || !mongoose.isValidObjectId(payload.userId)) {
    throw new AuthorizationError("Vui lòng đăng nhập", 401);
  }

  // Đảm bảo MongoDB đã kết nối trước khi truy vấn.
  await connectDB();

  const user = await getUserById(payload.userId);

  if (!user || user.status !== "active") {
    throw new AuthorizationError("Phiên đăng nhập không hợp lệ", 401);
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    throw new AuthorizationError("Bạn không có quyền truy cập", 403);
  }

  return user;
}
