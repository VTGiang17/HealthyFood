import { z } from "zod";

export const createIngredientSchema = z
  .object({
    category_id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "ID danh mục không hợp lệ"),
    name: z.string().trim().min(2, "Tên nguyên liệu tối thiểu 2 ký tự"),
    description: z.string().trim().optional(),
    image_url: z.union([z.url(), z.literal("")]).optional(),

    nutrition: z.object({
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
    }),

    price_per_100g: z.number().min(0),
    min_grams: z.number().positive(),
    max_grams: z.number().positive(),
    step_grams: z.number().positive(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => data.max_grams >= data.min_grams, {
    message: "Gram tối đa phải lớn hơn hoặc bằng gram tối thiểu",
    path: ["max_grams"],
  });

export const updateIngredientSchema = createIngredientSchema
  .safeExtend({})
  .partial();

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;

export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
