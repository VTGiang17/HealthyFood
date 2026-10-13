import { z } from "zod";

export const createOrderSchema = z.object({
  receiver_name: z.string().trim().min(2, "Tên người nhận tối thiểu 2 ký tự"),

  phone: z
    .string()
    .trim()
    .regex(/^0[0-9]{9}$/, "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0"),

  address: z.string().trim().min(5, "Địa chỉ không hợp lệ"),

  note: z.string().trim().max(500).optional(),

  payment_method: z.literal("cod").default("cod"),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "confirmed",
    "preparing",
    "delivering",
    "completed",
    "cancelled",
  ]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type OrderStatus = z.infer<typeof orderStatusSchema>["status"];
