import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục tối thiểu 2 ký tự"),

  description: z.string().trim().optional(),

  image_url: z.union([z.url(), z.literal("")]).optional(),

  is_active: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
