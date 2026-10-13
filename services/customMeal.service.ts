import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import Ingredient from "@/models/Ingredient";

import type { CustomMealInput } from "@/validations/customMeal.schema";

export class CustomMealError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "CustomMealError";
  }
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

export const previewCustomMeal = async (data: CustomMealInput) => {
  const ids = data.items.map((item) => item.ingredient_id.toLowerCase());

  const ingredients = await Ingredient.find({
    _id: { $in: ids },
    is_active: true,
  })
    .populate("category_id", "name")
    .lean();

  if (ingredients.length !== ids.length) {
    throw new CustomMealError(
      "Có nguyên liệu không tồn tại hoặc đã ngừng bán",
      400
    );
  }

  const ingredientMap = new Map(
    ingredients.map((ingredient) => [ingredient._id.toString(), ingredient])
  );

  let totalPrice = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalGrams = 0;

  const items = data.items.map((item) => {
    const ingredient = ingredientMap.get(item.ingredient_id.toLowerCase());

    if (!ingredient) {
      throw new CustomMealError("Nguyên liệu không tồn tại", 400);
    }

    const { min_grams, max_grams, step_grams } = ingredient;

    const steps = (item.quantity - min_grams) / step_grams;

    const validStep = Math.abs(steps - Math.round(steps)) < 1e-8;

    if (item.quantity < min_grams || item.quantity > max_grams || !validStep) {
      throw new CustomMealError(
        `Số gram của ${ingredient.name} không hợp lệ`,
        400
      );
    }

    const ratio = item.quantity / 100;

    const price = ingredient.price_per_100g * ratio;
    const calories = ingredient.nutrition.calories * ratio;
    const protein = ingredient.nutrition.protein * ratio;
    const carbs = ingredient.nutrition.carbs * ratio;
    const fat = ingredient.nutrition.fat * ratio;

    totalPrice += price;
    totalCalories += calories;
    totalProtein += protein;
    totalCarbs += carbs;
    totalFat += fat;
    totalGrams += item.quantity;

    return {
      ingredient_id: ingredient._id,
      name: ingredient.name,
      image_url: ingredient.image_url,
      category: ingredient.category_id,
      quantity: item.quantity,

      price: Math.round(price),

      nutrition: {
        calories: round(calories),
        protein: round(protein),
        carbs: round(carbs),
        fat: round(fat),
      },
    };
  });

  return {
    items,

    totals: {
      quantity: totalGrams,
      price: Math.round(totalPrice),
      calories: round(totalCalories),
      protein: round(totalProtein),
      carbs: round(totalCarbs),
      fat: round(totalFat),
    },
  };
};

export const handleCustomMealError = (error: unknown) => {
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

  if (error instanceof CustomMealError) {
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

  console.error("Custom meal error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Lỗi máy chủ",
    },
    { status: 500 }
  );
};
