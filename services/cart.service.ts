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

type CartItem = {
  _id: mongoose.Types.ObjectId;
  type: "meal" | "custom";
  meal_id?: mongoose.Types.ObjectId | null;
  ingredients: {
    ingredient_id: mongoose.Types.ObjectId;
    quantity: number;
  }[];
  quantity: number;
};

const calculateCart = async (cart: { items: CartItem[] }) => {
  let totalPrice = 0;
  let totalCalories = 0;

  const items = await Promise.all(
    cart.items.map(async (item) => {
      let name: string;
      let imageUrl = "";
      let unitPrice: number;
      let unitCalories: number;
      let details: unknown = null;

      if (item.type === "meal") {
        if (!item.meal_id) {
          throw new CartError("Món ăn không hợp lệ", 400);
        }

        const meal = await getMealById(item.meal_id.toString());

        name = String(meal.name);
        imageUrl = String(meal.image_url ?? "");
        unitPrice = meal.totals.price;
        unitCalories = meal.totals.calories;
        details = meal.ingredients;
      } else {
        const preview = await previewCustomMeal({
          items: item.ingredients.map((ingredient) => ({
            ingredient_id: ingredient.ingredient_id.toString(),
            quantity: ingredient.quantity,
          })),
        });

        name = "Phần cơm tự thiết kế";
        unitPrice = preview.totals.price;
        unitCalories = preview.totals.calories;
        details = preview.items;
      }

      const subtotal = unitPrice * item.quantity;
      const calories = unitCalories * item.quantity;

      totalPrice += subtotal;
      totalCalories += calories;

      return {
        _id: item._id,
        type: item.type,
        meal_id: item.meal_id ?? null,
        name,
        image_url: imageUrl,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
        calories,
        details,
      };
    })
  );

  return {
    items,
    totals: {
      total_items: items.reduce((sum, item) => sum + item.quantity, 0),
      total_price: Math.round(totalPrice),
      total_calories: Math.round(totalCalories),
    },
  };
};

export const getCart = async (userId: string) => {
  const cart = await Cart.findOne({
    user_id: userId,
  }).lean();

  if (!cart) {
    return {
      items: [],
      totals: {
        total_items: 0,
        total_price: 0,
        total_calories: 0,
      },
    };
  }

  return calculateCart(
    cart as unknown as {
      items: CartItem[];
    }
  );
};

export const addCartItem = async (userId: string, data: AddCartItemInput) => {
  // Xác thực món và nguyên liệu trước khi lưu.
  if (data.type === "meal") {
    await getMealById(data.meal_id);
  } else {
    await previewCustomMeal({
      items: data.ingredients,
    });
  }

  const cart = await Cart.findOneAndUpdate(
    { user_id: userId },
    { $setOnInsert: { user_id: userId } },
    { upsert: true, new: true }
  );

  if (!cart) {
    throw new CartError("Không thể tạo giỏ hàng", 500);
  }

  // Mỗi lần thêm tạo một dòng giỏ hàng riêng.
  // Có thể bổ sung gộp món trùng nhau sau này.
  if (data.type === "meal") {
    cart.items.push({
      type: "meal",
      meal_id: data.meal_id,
      ingredients: [],
      quantity: data.quantity,
    });
  } else {
    cart.items.push({
      type: "custom",
      meal_id: null,
      ingredients: data.ingredients,
      quantity: data.quantity,
    });
  }

  await cart.save();

  return getCart(userId);
};

export const updateCartItem = async (
  userId: string,
  itemId: string,
  quantity: number
) => {
  if (!mongoose.isValidObjectId(itemId)) {
    throw new CartError("ID món trong giỏ không hợp lệ", 400);
  }

  const cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    throw new CartError("Không tìm thấy giỏ hàng", 404);
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new CartError("Không tìm thấy món trong giỏ", 404);
  }

  item.quantity = quantity;
  await cart.save();

  return getCart(userId);
};

export const removeCartItem = async (userId: string, itemId: string) => {
  if (!mongoose.isValidObjectId(itemId)) {
    throw new CartError("ID món trong giỏ không hợp lệ", 400);
  }

  const cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    throw new CartError("Không tìm thấy giỏ hàng", 404);
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new CartError("Không tìm thấy món trong giỏ", 404);
  }

  cart.items.pull({ _id: itemId });
  await cart.save();

  return getCart(userId);
};

export const clearCart = async (userId: string) => {
  await Cart.updateOne({ user_id: userId }, { $set: { items: [] } });

  return {
    items: [],
    totals: {
      total_items: 0,
      total_price: 0,
      total_calories: 0,
    },
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
