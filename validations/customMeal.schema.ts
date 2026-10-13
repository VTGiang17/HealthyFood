import { z } from "zod";

const customMealItemSchema = z.object({
  ingredient_id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "ID nguyên liệu không hợp lệ"),

  quantity: z.number().finite().positive("Số gram phải lớn hơn 0"),
});

export const customMealSchema = z.object({
  items: z
    .array(customMealItemSchema)
    .min(1, "Vui lòng chọn ít nhất một nguyên liệu")
    .max(30, "Không được chọn quá 30 nguyên liệu")
    .refine(
      (items) =>
        new Set(items.map((item) => item.ingredient_id.toLowerCase())).size ===
        items.length,
      "Không được chọn trùng nguyên liệu"
    ),
});

export type CustomMealInput = z.infer<typeof customMealSchema>;
