import { z } from "zod";

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự"),

  email: z.email("Email không hợp lệ"),

  phone: z.string().trim().optional(),

  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(72, "Mật khẩu không được vượt quá 72 ký tự"),
});

export const loginSchema = z.object({
  email: z.email("Email không hợp lệ"),

  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
