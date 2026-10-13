import "server-only";

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import Ingredient from "@/models/Ingredient";
import Category from "@/models/Category";
import { AuthorizationError } from "@/libs/authorization";

import type {
  CreateIngredientInput,
  UpdateIngredientInput,
} from "@/validations/ingredient.schema";

export class IngredientError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

const validateCategory = async (categoryId: string) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new IngredientError("ID danh mục không hợp lệ", 400);
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new IngredientError("Danh mục không tồn tại", 404);
  }
};

const validateGrams = (min: number, max: number, step: number) => {
  if (min <= 0 || max < min || step <= 0) {
    throw new IngredientError("Giới hạn gram không hợp lệ", 400);
  }
};

export const getIngredients = async (filters: {
  categoryId?: string;
  search?: string;
}) => {
  const query: Record<string, unknown> = {
    is_active: true,
  };

  if (filters.categoryId) {
    if (!mongoose.isValidObjectId(filters.categoryId)) {
      throw new IngredientError("ID danh mục không hợp lệ", 400);
    }
    query.category_id = filters.categoryId;
  }

  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.name = { $regex: escaped, $options: "i" };
  }

  return Ingredient.find(query)
    .populate("category_id", "name")
    .sort({ name: 1 })
    .lean();
};

export const getIngredientById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new IngredientError("ID nguyên liệu không hợp lệ", 400);
  }

  const ingredient = await Ingredient.findOne({
    _id: id,
    is_active: true,
  })
    .populate("category_id", "name")
    .lean();

  if (!ingredient) {
    throw new IngredientError("Không tìm thấy nguyên liệu", 404);
  }

  return ingredient;
};

export const createIngredient = async (data: CreateIngredientInput) => {
  await validateCategory(data.category_id);

  validateGrams(data.min_grams, data.max_grams, data.step_grams);

  return Ingredient.create(data);
};

export const updateIngredient = async (
  id: string,
  data: UpdateIngredientInput
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new IngredientError("ID nguyên liệu không hợp lệ", 400);
  }

  const ingredient = await Ingredient.findById(id);

  if (!ingredient) {
    throw new IngredientError("Không tìm thấy nguyên liệu", 404);
  }

  if (data.category_id) {
    await validateCategory(data.category_id);
  }

  const min = data.min_grams ?? ingredient.min_grams;
  const max = data.max_grams ?? ingredient.max_grams;
  const step = data.step_grams ?? ingredient.step_grams;

  validateGrams(min, max, step);

  ingredient.set(data);
  await ingredient.save();

  return ingredient;
};

export const deleteIngredient = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new IngredientError("ID nguyên liệu không hợp lệ", 400);
  }

  // Soft delete: giữ dữ liệu phục vụ đơn hàng cũ.
  const ingredient = await Ingredient.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true }
  );

  if (!ingredient) {
    throw new IngredientError("Không tìm thấy nguyên liệu", 404);
  }

  return ingredient;
};

export const handleIngredientError = (error: unknown) => {
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

  if (error instanceof IngredientError || error instanceof AuthorizationError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.statusCode }
    );
  }

  console.error("Ingredient error:", error);

  return NextResponse.json(
    { success: false, message: "Lỗi máy chủ" },
    { status: 500 }
  );
};
