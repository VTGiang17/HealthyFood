import "server-only";
import bcrypt from "bcryptjs";

import User from "@/models/User";

import type { RegisterInput, LoginInput } from "@/validations/auth.schema";

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AuthError";
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const register = async (data: RegisterInput) => {
  const email = normalizeEmail(data.email);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AuthError("Email đã được sử dụng", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  let user;

  try {
    user = await User.create({
      full_name: data.full_name,
      email,
      phone: data.phone ?? "",
      password: hashedPassword,
      role: "customer",
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AuthError("Email đã được sử dụng", 409);
    }

    throw error;
  }

  return {
    id: user._id.toString(),
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };
};

export const login = async (data: LoginInput) => {
  const email = normalizeEmail(data.email);

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AuthError("Email hoặc mật khẩu không chính xác", 401);
  }

  const isMatch = await bcrypt.compare(data.password, user.password);

  if (!isMatch) {
    throw new AuthError("Email hoặc mật khẩu không chính xác", 401);
  }

  if (user.status !== "active") {
    throw new AuthError("Tài khoản đã bị khóa", 403);
  }

  return {
    id: user._id.toString(),
    full_name: user.full_name,
    email: user.email,
    role: user.role as "admin" | "customer",
  };
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId)
    .select("full_name email phone avatar role status")
    .lean();

  return user;
};
