import { z } from "zod";

const mealIngredientSchema = z.object({
  ingredient_id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "ID nguyên liệu không hợp lệ"),

  quantity: z.number().positive("Số gram phải lớn hơn 0"),
});

export const createMealSchema = z.object({
  name: z.string().trim().min(2, "Tên món ăn tối thiểu 2 ký tự"),

  description: z.string().trim().optional(),

  image_url: z.union([z.url(), z.literal("")]).optional(),

  ingredients: z
    .array(mealIngredientSchema)
    .min(1, "Phần cơm phải có ít nhất một nguyên liệu")
    .refine(
      (items) =>
        new Set(items.map((item) => item.ingredient_id.toLowerCase())).size ===
        items.length,
      "Không được chọn trùng nguyên liệu"
    ),

  calories: z.number().min(0).nullable().optional(),

  is_recommended: z.boolean().optional(),

  is_active: z.boolean().optional(),
});

export const updateMealSchema = createMealSchema.partial();

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
