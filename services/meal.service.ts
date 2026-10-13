import "server-only";

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import Meal from "@/models/Meal";
import Ingredient from "@/models/Ingredient";

import { AuthorizationError } from "@/libs/authorization";
import { calculateTotalNutrition } from "@/libs/nutrition";

import type {
  CreateMealInput,
  UpdateMealInput,
} from "@/validations/meal.schema";

export class MealError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "MealError";
  }
}

type MealItem = {
  ingredient_id: string;
  quantity: number;
};

interface MealData {
  _id: unknown;
  name: string;
  description: string;
  image_url: string;
  is_recommended: boolean;
  is_active: boolean;

  ingredients: {
    ingredient_id: {
      toString(): string;
    };
    quantity: number;
  }[];
}

const validateIngredients = async (
  items: MealItem[],
  allowInactive = false
) => {
  if (items.length === 0) {
    throw new MealError("Phần cơm phải có ít nhất một nguyên liệu", 400);
  }

  const ids = items.map((item) => item.ingredient_id.toLowerCase());

  if (new Set(ids).size !== ids.length) {
    throw new MealError("Nguyên liệu bị trùng", 400);
  }

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new MealError("ID nguyên liệu không hợp lệ", 400);
  }

  const filter: Record<string, unknown> = {
    _id: { $in: ids },
  };

  if (!allowInactive) {
    filter.is_active = true;
  }

  const ingredients = await Ingredient.find(filter).lean();

  if (ingredients.length !== ids.length) {
    throw new MealError("Có nguyên liệu không tồn tại hoặc đã bị ẩn", 400);
  }

  const ingredientMap = new Map(
    ingredients.map((ingredient) => [ingredient._id.toString(), ingredient])
  );

  const nutritionItems = items.map((item) => {
    const ingredient = ingredientMap.get(item.ingredient_id.toLowerCase());

    if (!ingredient) {
      throw new MealError("Nguyên liệu không tồn tại", 400);
    }

    const { min_grams, max_grams, step_grams } = ingredient;

    const steps = (item.quantity - min_grams) / step_grams;

    const validStep = Math.abs(steps - Math.round(steps)) < 1e-8;

    if (
      !Number.isFinite(item.quantity) ||
      item.quantity < min_grams ||
      item.quantity > max_grams ||
      !validStep
    ) {
      throw new MealError(`Số gram của ${ingredient.name} không hợp lệ`, 400);
    }

    return {
      nutrition: ingredient.nutrition,
      price_per_100g: ingredient.price_per_100g,
      quantity: item.quantity,
    };
  });

  return calculateTotalNutrition(nutritionItems);
};

const formatMeal = async (meal: MealData) => {
  const items: MealItem[] = meal.ingredients.map((item) => ({
    ingredient_id: item.ingredient_id.toString(),
    quantity: item.quantity,
  }));

  const totals = await validateIngredients(items, true);

  return {
    ...meal,

    totals: {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      price: Math.round(totals.price),
    },
  };
};

// GET danh sách món ăn
export const getMeals = async (isRecommended?: boolean) => {
  const filter: Record<string, unknown> = {
    is_active: true,
  };

  if (isRecommended !== undefined) {
    filter.is_recommended = isRecommended;
  }

  const meals = await Meal.find(filter).sort({ createdAt: -1 }).lean();

  return Promise.all(meals.map(formatMeal));
};

// GET chi tiết món ăn
export const getMealById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new MealError("ID món ăn không hợp lệ", 400);
  }

  const meal = await Meal.findOne({
    _id: id,
    is_active: true,
  }).lean();

  if (!meal) {
    throw new MealError("Không tìm thấy món ăn", 404);
  }

  return formatMeal(meal);
};

// POST tạo món ăn
export const createMeal = async (data: CreateMealInput) => {
  await validateIngredients(data.ingredients);

  return Meal.create(data);
};

// PUT cập nhật món ăn
export const updateMeal = async (id: string, data: UpdateMealInput) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new MealError("ID món ăn không hợp lệ", 400);
  }

  const meal = await Meal.findById(id);

  if (!meal) {
    throw new MealError("Không tìm thấy món ăn", 404);
  }

  if (data.ingredients) {
    await validateIngredients(data.ingredients);
  }

  meal.set(data);
  await meal.save();

  return meal;
};

// DELETE: Ẩn món ăn
export const deleteMeal = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new MealError("ID món ăn không hợp lệ", 400);
  }

  const meal = await Meal.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true }
  );

  if (!meal) {
    throw new MealError("Không tìm thấy món ăn", 404);
  }

  return meal;
};

// Xử lý lỗi trong cùng Service
export const handleMealError = (error: unknown) => {
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

  if (error instanceof MealError || error instanceof AuthorizationError) {
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

  console.error("Meal error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Lỗi máy chủ",
    },
    { status: 500 }
  );
};
