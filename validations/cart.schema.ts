import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID không hợp lệ");

const ingredientSchema = z.object({
  ingredient_id: objectIdSchema,
  quantity: z.number().finite().positive(),
});

export const addCartItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("meal"),
    meal_id: objectIdSchema,
    quantity: z.number().int().min(1).max(99).default(1),
  }),

  z.object({
    type: z.literal("custom"),
    ingredients: z
      .array(ingredientSchema)
      .min(1)
      .max(30)
      .refine(
        (items) =>
          new Set(items.map((item) => item.ingredient_id.toLowerCase()))
            .size === items.length,
        "Không được chọn trùng nguyên liệu"
      ),
    quantity: z.number().int().min(1).max(99).default(1),
  }),
]);

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
