import "server-only";

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import User from "@/models/User";
import { AuthorizationError } from "@/libs/authorization";

import type { UserQueryInput } from "@/validations/user.schema";

export class UserError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "UserError";
  }
}

const validateId = (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new UserError("ID người dùng không hợp lệ", 400);
  }
};

const publicFields =
  "full_name email phone avatar role status createdAt updatedAt";

export const getUsers = async (query: UserQueryInput) => {
  const filter: Record<string, unknown> = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { full_name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(publicFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const getUserById = async (id: string) => {
  validateId(id);

  const user = await User.findById(id).select(publicFields).lean();

  if (!user) {
    throw new UserError("Không tìm thấy người dùng", 404);
  }

  return user;
};

export const updateUserStatus = async (
  id: string,
  status: "active" | "blocked",
  currentAdminId: string,
) => {
  validateId(id);

  if (id === currentAdminId && status === "blocked") {
    throw new UserError("Không thể tự khóa tài khoản của mình", 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new UserError("Không tìm thấy người dùng", 404);
  }

  if (user.role === "admin" && status === "blocked") {
    const activeAdminCount = await User.countDocuments({
      role: "admin",
      status: "active",
    });

    if (activeAdminCount <= 1 && user.status === "active") {
      throw new UserError("Không thể khóa Admin cuối cùng", 400);
    }
  }

  user.status = status;
  await user.save();

  return getUserById(id);
};

export const updateUserRole = async (
  id: string,
  role: "admin" | "customer",
  currentAdminId: string,
) => {
  validateId(id);

  if (id === currentAdminId && role === "customer") {
    throw new UserError("Không thể tự hạ quyền Admin", 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new UserError("Không tìm thấy người dùng", 404);
  }

  if (user.role === "admin" && role === "customer") {
    const adminCount = await User.countDocuments({
      role: "admin",
    });

    if (adminCount <= 1) {
      throw new UserError("Hệ thống phải có ít nhất một Admin", 400);
    }
  }

  user.role = role;
  await user.save();

  return getUserById(id);
};

export const handleUserError = (error: unknown) => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.issues,
      },
      { status: 400 },
    );
  }

  if (error instanceof UserError || error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        message: "JSON không hợp lệ",
      },
      { status: 400 },
    );
  }

  console.error("User error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Lỗi máy chủ",
    },
    { status: 500 },
  );
};
