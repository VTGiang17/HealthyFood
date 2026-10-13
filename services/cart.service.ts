import "server-only";

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import Cart from "@/models/Cart";
import { getMealById } from "@/services/meal.service";
import { previewCustomMeal } from "@/services/customMeal.service";
import { AuthorizationError } from "@/libs/authorization";

import type { AddCartItemInput } from "@/validations/cart.schema";

export class CartError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "CartError";
  }
}

type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type IngredientItem = {
  ingredient_id: mongoose.Types.ObjectId;
  quantity: number;
};

type CartItem = {
  _id: mongoose.Types.ObjectId;
  type: "meal" | "custom";
  meal_id?: mongoose.Types.ObjectId | null;
  ingredients: IngredientItem[];
  quantity: number;
};

export type CalculatedCartItem = {
  _id: string;
  type: "meal" | "custom";
  meal_id: string | null;
  name: string;
  image_url: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  nutrition: Nutrition;
  ingredients: {
    ingredient_id: string;
    name: string;
    quantity: number;
  }[];
  available: boolean;
  error: string | null;
};

const round = (value: number) => Math.round(value * 10) / 10;

const emptyTotals = () => ({
  total_items: 0,
  total_price: 0,
  total_calories: 0,
});

export const calculateCart = async (cart: { items: CartItem[] }) => {
  const items: CalculatedCartItem[] = await Promise.all(
    cart.items.map(async (item) => {
      const base = {
        _id: item._id.toString(),
        type: item.type,
        meal_id: item.meal_id?.toString() ?? null,
        quantity: item.quantity,
      };

      try {
        if (item.type === "meal") {
          if (!item.meal_id) {
            throw new CartError("Món ăn không hợp lệ", 400);
          }

          const meal = await getMealById(item.meal_id.toString());

          const nutrition: Nutrition = {
            calories: meal.totals.calories,
            protein: meal.totals.protein,
            carbs: meal.totals.carbs,
            fat: meal.totals.fat,
          };

          return {
            ...base,
            name: meal.name,
            image_url: meal.image_url ?? "",
            unit_price: meal.totals.price,
            subtotal: meal.totals.price * item.quantity,
            nutrition,
            ingredients: [],
            available: true,
            error: null,
          };
        }

        const preview = await previewCustomMeal({
          items: item.ingredients.map((ingredient) => ({
            ingredient_id: ingredient.ingredient_id.toString(),
            quantity: ingredient.quantity,
          })),
        });

        return {
          ...base,
          name: "Phần cơm tự thiết kế",
          image_url: "",
          unit_price: preview.totals.price,
          subtotal: preview.totals.price * item.quantity,
          nutrition: {
            calories: preview.totals.calories,
            protein: preview.totals.protein,
            carbs: preview.totals.carbs,
            fat: preview.totals.fat,
          },
          ingredients: preview.items.map((ingredient) => ({
            ingredient_id: ingredient.ingredient_id.toString(),
            name: ingredient.name,
            quantity: ingredient.quantity,
          })),
          available: true,
          error: null,
        };
      } catch {
        return {
          ...base,
          name: "Món ăn không còn khả dụng",
          image_url: "",
          unit_price: 0,
          subtotal: 0,
          nutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
          ingredients: [],
          available: false,
          error: "Món ăn hoặc nguyên liệu đã ngừng bán hoặc không còn hợp lệ",
        };
      }
    })
  );

  return {
    items,
    totals: {
      total_items: items.reduce((sum, item) => sum + item.quantity, 0),
      total_price: items.reduce((sum, item) => sum + item.subtotal, 0),
      total_calories: round(
        items.reduce(
          (sum, item) => sum + item.nutrition.calories * item.quantity,
          0
        )
      ),
    },
  };
};

export const getCart = async (userId: string) => {
  const cart = await Cart.findOne({
    user_id: userId,
  }).lean();

  if (!cart) {
    return {
      items: [] as CalculatedCartItem[],
      totals: emptyTotals(),
    };
  }

  return calculateCart(cart as unknown as { items: CartItem[] });
};

export const addCartItem = async (userId: string, data: AddCartItemInput) => {
  if (data.type === "meal") {
    await getMealById(data.meal_id);
  } else {
    await previewCustomMeal({
      items: data.ingredients,
    });
  }

  const item =
    data.type === "meal"
      ? {
          type: "meal",
          meal_id: data.meal_id,
          ingredients: [],
          quantity: data.quantity,
        }
      : {
          type: "custom",
          meal_id: null,
          ingredients: data.ingredients,
          quantity: data.quantity,
        };

  // Tạo giỏ nếu chưa có.
  await Cart.updateOne(
    { user_id: userId },
    {
      $setOnInsert: {
        user_id: userId,
        items: [],
      },
    },
    { upsert: true }
  );

  const updated = await Cart.findOneAndUpdate(
    {
      user_id: userId,
      checkout_token: null,
    },
    { $push: { items: item } },
    { new: true }
  );

  if (!updated) {
    throw new CartError("Giỏ hàng đang được xử lý đặt hàng", 409);
  }

  return getCart(userId);
};

export const updateCartItem = async (
  userId: string,
  itemId: string,
  quantity: number
) => {
  if (!mongoose.isValidObjectId(itemId)) {
    throw new CartError("ID món không hợp lệ", 400);
  }

  const updated = await Cart.findOneAndUpdate(
    {
      user_id: userId,
      checkout_token: null,
      "items._id": itemId,
    },
    {
      $set: {
        "items.$.quantity": quantity,
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new CartError("Không tìm thấy món hoặc giỏ đang được xử lý", 409);
  }

  return getCart(userId);
};

export const removeCartItem = async (userId: string, itemId: string) => {
  if (!mongoose.isValidObjectId(itemId)) {
    throw new CartError("ID món không hợp lệ", 400);
  }

  const updated = await Cart.findOneAndUpdate(
    {
      user_id: userId,
      checkout_token: null,
      "items._id": itemId,
    },
    {
      $pull: {
        items: { _id: itemId },
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new CartError("Không tìm thấy món hoặc giỏ đang được xử lý", 409);
  }

  return getCart(userId);
};

export const clearCart = async (userId: string) => {
  const updated = await Cart.findOneAndUpdate(
    {
      user_id: userId,
      checkout_token: null,
    },
    {
      $set: { items: [] },
    },
    { new: true }
  );

  if (!updated) {
    throw new CartError("Giỏ hàng không tồn tại hoặc đang được xử lý", 409);
  }

  return {
    items: [],
    totals: emptyTotals(),
  };
};

export const handleCartError = (error: unknown) => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof CartError || error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        message: "JSON không hợp lệ",
      },
      { status: 400 }
    );
  }

  console.error("Cart error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Lỗi máy chủ",
    },
    { status: 500 }
  );
};
