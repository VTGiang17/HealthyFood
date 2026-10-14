import { z } from "zod";

const ingredientBaseSchema = z.object({
  category_id: z.string().min(1, "Vui lòng chọn danh mục"),

  name: z.string().trim().min(1, "Vui lòng nhập tên nguyên liệu"),

  description: z.string().trim().optional().default(""),

  image_url: z.string().optional().default(""),

  nutrition: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
  }),

  price_per_100g: z.number().min(0),

  min_grams: z.number().min(1),

  max_grams: z.number().min(1),

  step_grams: z.number().min(1),

  is_active: z.boolean().default(true),
});

export const createIngredientSchema = ingredientBaseSchema.refine(
  (data) => data.max_grams >= data.min_grams,
  {
    message: "Gram tối đa phải lớn hơn hoặc bằng gram tối thiểu",
    path: ["max_grams"],
  }
);

export const updateIngredientSchema = ingredientBaseSchema
  .partial()
  .refine(
    (data) =>
      data.min_grams === undefined ||
      data.max_grams === undefined ||
      data.max_grams >= data.min_grams,
    {
      message: "Gram tối đa phải lớn hơn hoặc bằng gram tối thiểu",
      path: ["max_grams"],
    }
  );

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;

export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
